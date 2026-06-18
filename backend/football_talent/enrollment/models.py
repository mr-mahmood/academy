# football_talent/enrollments/models.py
from django.db import models
from django.utils import timezone
from django.db import transaction
from users.models import User
from football_talent.courses.models import FootballCourse
from core.exceptions import APIError, RegistrationError
from core.cache_service import CacheService
from django.core.cache import cache


class FootballEnrollment(models.Model):
    """User enrollment in a football test/course - stores age category"""
    id: int
    
    class EnrollmentStatus(models.TextChoices):
        WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT', 'Waiting for Payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
    
    class AgeCategory(models.TextChoices):
        U12 = "U12", "زیر ۱۲ سال"
        U13 = "U13", "زیر ۱۳ سال"
        U14 = "U14", "زیر ۱۴ سال"
        U15 = "U15", "زیر ۱۵ سال"
        U17 = "U17", "زیر ۱۷ سال"
        U18 = "U18", "زیر ۱۸ سال"
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='football_enrollments',
        verbose_name="User"
    )
    
    course = models.ForeignKey(
        FootballCourse, 
        on_delete=models.CASCADE, 
        related_name='enrollments',
        verbose_name="Football Course"
    )
    
    # Age category is stored on enrollment
    age_category = models.CharField(
        max_length=20,
        choices=AgeCategory.choices,
        verbose_name="Age Category at Enrollment",
        db_index=True,
        default=AgeCategory.U12
    )
    
    enrollment_status = models.CharField(
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.WAITING_FOR_PAYMENT,
        verbose_name="Enrollment Status"
    )
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = "football_enrollments"
        verbose_name = "Football Enrollment"
        verbose_name_plural = "Football Enrollments"
        unique_together = [['user', 'course']]
        ordering = ['-enrolled_at']
        
        indexes = [
            models.Index(fields=['enrolled_at']),
            models.Index(fields=['enrollment_status']),
            models.Index(fields=['age_category']),
            models.Index(fields=['user', 'enrollment_status']),
            models.Index(fields=['course', 'enrollment_status']),
            models.Index(fields=['user', 'enrollment_status', '-enrolled_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.course} - {self.age_category}"
    
    def update_age_category(self, save=True):
        """Update age category from user's current age category"""
        user_age_category = self.user.age_category
        
        # Only update if user has a valid age category (not OOR)
        if user_age_category and user_age_category != User.AgeCategory.OUT_OF_RANGE:
            if self.age_category != user_age_category:
                self.age_category = user_age_category
                if save:
                    self.save(update_fields=['age_category', 'updated_at'])
                return True
        return False
    
    @classmethod
    def update_all_enrollments_for_user(cls, user: User):
        """
        Update all enrollments for a user when age category changes.
        - Never delete paid (CONFIRMED) enrollments
        - Only delete waiting for payment enrollments when user becomes OOR
        """
        # If user is OUT_OF_RANGE
        if user.age_category == User.AgeCategory.OUT_OF_RANGE:
            # Delete unpaid enrollments
            deleted_count, _ = cls.objects.filter(
                user=user,
                enrollment_status=cls.EnrollmentStatus.WAITING_FOR_PAYMENT
            ).delete()
            
            # For paid enrollments, we keep them as-is
            # They remain valid even though user is now OOR
            # (User already paid, can't take that away)
            
            # Clear cache
            cache.delete(f"football_user:{user.id}:enrollments")
            cache.delete(f"football_user:{user.id}:active_enrollments")
            
            return deleted_count
        
        # Normal age category change (not OOR)
        # Update age categories for ALL enrollments (including paid ones)
        updated = 0
        enrollments = cls.objects.filter(user=user)
        
        for enrollment in enrollments:
            # Update age category if changed
            old_category = enrollment.age_category
            new_category = user.age_category
            
            if old_category != new_category:
                enrollment.age_category = new_category
                enrollment.save(update_fields=['age_category', 'updated_at'])
                updated += 1
        
        # Clear cache
        if updated > 0:
            cache.delete(f"football_user:{user.id}:enrollments")
            cache.delete(f"football_user:{user.id}:active_enrollments")
        
        return updated
    
    @classmethod
    def get_enrollment(cls, id: int, user=None) -> 'FootballEnrollment':
        """Get enrollment by ID with caching"""
        enrollment = CacheService.get_model(cls, id, timeout=CacheService.DEFAULT_TIMEOUT)
        if not enrollment:
            raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
        
        if user and enrollment.user.id != user.id:
            raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
        
        return enrollment
    
    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        user : User = self.user
        
        # Track status changes
        was_cancelled = False
        was_reactivated = False
        
        if not is_new:
            try:
                old = FootballEnrollment.objects.get(pk=self.pk)
                if old.enrollment_status != self.EnrollmentStatus.CANCELLED and self.enrollment_status == self.EnrollmentStatus.CANCELLED:
                    was_cancelled = True
                if old.enrollment_status == self.EnrollmentStatus.CANCELLED and self.enrollment_status in [
                    self.EnrollmentStatus.WAITING_FOR_PAYMENT,
                    self.EnrollmentStatus.CONFIRMED
                ]:
                    was_reactivated = True
            except FootballEnrollment.DoesNotExist:
                pass
        
        # Lock the course row for update
        if is_new or was_reactivated:
            self.course = FootballCourse.objects.select_for_update().get(id=self.course.id)
            
            if is_new:
                # Check if course is active
                if self.course.status != FootballCourse.Status.ACTIVE:
                    raise APIError(RegistrationError.FOOTBALL_COURSE_NOT_ACTIVE)
                
                # Check if user has already enrolled in this course
                if FootballEnrollment.objects.filter(user=user, course=self.course, enrollment_status=self.EnrollmentStatus.CONFIRMED).exists():
                    raise APIError(RegistrationError.FOOTBALL_COURSE_ALREADY_ENROLLED)
                
                # Check gender requirement
                if self.course.gender_requirement == FootballCourse.GenderRequirement.MALE and user.gender != 'MALE':
                    raise APIError(RegistrationError.FOOTBALL_GENDER_MISMATCH)
                if self.course.gender_requirement == FootballCourse.GenderRequirement.FEMALE and user.gender != 'FEMALE':
                    raise APIError(RegistrationError.FOOTBALL_GENDER_MISMATCH)
                
                # Set age category from user's current age category
                if not user.age_category or user.age_category == User.AgeCategory.OUT_OF_RANGE:
                    raise APIError(RegistrationError.FOOTBALL_AGE_CATEGORY_NOT_FOUND)
                
                self.age_category = user.age_category
                
                self.course.save(update_fields=['status'])
            
            elif was_reactivated:
                self.course.save(update_fields=['status'])
                self.cancelled_at = None
        
        # Handle cancellation
        if was_cancelled:
            if not self.cancelled_at:
                self.cancelled_at = timezone.now()
            
            course = FootballCourse.objects.select_for_update().get(id=self.course.id)
            course.save(update_fields=['status'])
        
        super().save(*args, **kwargs)
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete(f"football_user:{user.id}:enrollments")
        cache.delete(f"football_user:{user.id}:active_enrollments")
        cache.delete(f"football_course:{self.course.id}:enrollments")
        cache.delete("football_enrollments:all_list")
        cache.delete("football_enrollments:active_list")
    
    @transaction.atomic   
    def delete(self, *args, **kwargs):
        course = FootballCourse.objects.select_for_update().get(id=self.course.id)
        
        user_id = self.user.id
        course_id = self.course.id
        enrollment_id = self.pk
        
        was_counted = self.enrollment_status in [
            self.EnrollmentStatus.WAITING_FOR_PAYMENT,
            self.EnrollmentStatus.CONFIRMED
        ]
        
        result = super().delete(*args, **kwargs)
        
        if was_counted:
            course.save(update_fields=['status'])
        
        CacheService.invalidate_model(self.__class__, enrollment_id)
        cache.delete(f"football_user:{user_id}:enrollments")
        cache.delete(f"football_user:{user_id}:active_enrollments")
        cache.delete(f"football_course:{course_id}:enrollments")
        cache.delete("football_enrollments:all_list")
        cache.delete("football_enrollments:active_list")
        
        return result