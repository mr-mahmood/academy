from django.db import models
from django.utils import timezone
from django.db import transaction
from users.models import User
from football_talent.courses.models import FootballCourse
from core.exceptions import APIError, RegistrationError
from core.cache_service import CacheService
from django.core.cache import cache


class FootballEnrollment(models.Model):
    """User enrollment in a football test/course"""
    id: int
    
    class EnrollmentStatus(models.TextChoices):
        WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT', 'Waiting for Payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
    
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
            models.Index(fields=['user', 'enrollment_status']),
            models.Index(fields=['course', 'enrollment_status']),
            models.Index(fields=['user', 'enrollment_status', '-enrolled_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.course}"
    
    def check_time_conflict(self):
        """
        Check if this football test conflicts with existing enrollments.
        Uses the course's test_date, start_time, and end_time for accurate conflict detection.
        """
        # Get the current test's time range
        current_test_date = self.course.test_date
        current_start_time = self.course.start_time
        current_end_time = self.course.end_time
        
        # Check if user has any other active enrollments (confirmed or waiting for payment)
        # that have overlapping test times on the same date
        conflicting_enrollments = FootballEnrollment.objects.filter(
            user=self.user,
            enrollment_status__in=[
                self.EnrollmentStatus.WAITING_FOR_PAYMENT,
                self.EnrollmentStatus.CONFIRMED
            ]
        ).exclude(
            # Exclude current enrollment if updating
            pk=self.pk if self.pk else None
        ).filter(
            # Same date
            course__test_date=current_test_date
        ).filter(
            # Time overlap condition: existing test starts before current ends AND ends after current starts
            course__start_time__lt=current_end_time,
            course__end_time__gt=current_start_time
        )
        
        return conflicting_enrollments.exists()
    
    def _get_user_age_category(self):
        """Get user's age category from birth date"""
        if not self.user.birth_date:
            return None
        
        today = timezone.now().date()
        age = today.year - self.user.birth_date.year
        
        if today.month < self.user.birth_date.month or \
           (today.month == self.user.birth_date.month and today.day < self.user.birth_date.day):
            age -= 1
        
        if age < 12:
            return 'U12'
        elif age == 12:
            return 'U13'
        elif age == 13:
            return 'U14'
        elif age == 14:
            return 'U15'
        elif 15 <= age <= 16:
            return 'U17'
        elif 17 <= age <= 18:
            return 'U18'
        elif age == 19:
            return 'YOUTH'
        elif age == 20:
            return 'U21'
        else:
            return None
    
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
        
        # Track status changes
        was_cancelled = False
        was_reactivated = False
        
        if not is_new:
            try:
                old = FootballEnrollment.objects.get(pk=self.pk)
                # Check if status changed to CANCELLED
                if old.enrollment_status != self.EnrollmentStatus.CANCELLED and self.enrollment_status == self.EnrollmentStatus.CANCELLED:
                    was_cancelled = True
                # Check if status changed from CANCELLED to active
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
                # Check capacity
                if self.course.is_full:
                    raise APIError(RegistrationError.FOOTBALL_COURSE_FULL)
                
                # Check if course is active
                if self.course.status != FootballCourse.Status.ACTIVE:
                    raise APIError(RegistrationError.FOOTBALL_COURSE_NOT_ACTIVE)
                
                # Check if user has already enrolled in this course
                if FootballEnrollment.objects.filter(user=self.user, course=self.course).exists():
                    raise APIError(RegistrationError.FOOTBALL_COURSE_ALREADY_ENROLLED)
                
                # Check gender requirement
                if self.course.gender_requirement == FootballCourse.GenderRequirement.MALE and self.user.gender != 'MALE':
                    raise APIError(RegistrationError.FOOTBALL_GENDER_MISMATCH)
                if self.course.gender_requirement == FootballCourse.GenderRequirement.FEMALE and self.user.gender != 'FEMALE':
                    raise APIError(RegistrationError.FOOTBALL_GENDER_MISMATCH)
                
                # Check for time conflict with other football tests
                if self.check_time_conflict():
                    raise APIError(RegistrationError.FOOTBALL_TIME_CONFLICT)
                
                # Check age category compatibility
                user_age_category = self._get_user_age_category()
                if user_age_category and user_age_category != self.course.age_category:
                    raise APIError(RegistrationError.FOOTBALL_AGE_CATEGORY_MISMATCH)
                
                # Check if test date is in the future
                if self.course.test_date and self.course.start_time:
                    from datetime import datetime
                    test_datetime = datetime.combine(self.course.test_date, self.course.start_time)
                    if timezone.is_naive(test_datetime):
                        test_datetime = timezone.make_aware(test_datetime)
                    
                    if test_datetime < timezone.now():
                        raise APIError(RegistrationError.FOOTBALL_TEST_DATE_PASSED)
                
                # Increment enrolled participants for new enrollment
                self.course.current_participants += 1
                self.course.save(update_fields=['current_participants', 'status'])
            
            elif was_reactivated:
                # Reactivating a cancelled enrollment - increment count again
                self.course.current_participants += 1
                self.course.save(update_fields=['current_participants', 'status'])
                # Clear cancelled_at timestamp
                self.cancelled_at = None
        
        # Handle cancellation - decrement count
        if was_cancelled:
            if not self.cancelled_at:
                self.cancelled_at = timezone.now()
            
            # Lock and decrement course count
            course = FootballCourse.objects.select_for_update().get(id=self.course.id)
            course.current_participants = max(0, course.current_participants - 1)
            course.save(update_fields=['current_participants', 'status'])
        
        super().save(*args, **kwargs)
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete(f"football_user:{self.user.id}:enrollments")
        cache.delete(f"football_user:{self.user.id}:active_enrollments")
        cache.delete(f"football_course:{self.course.id}:enrollments")
        cache.delete(f"football_course:capacity:{self.course.id}")
        cache.delete("football_enrollments:all_list")
        cache.delete("football_enrollments:active_list")
    
    @transaction.atomic   
    def delete(self, *args, **kwargs):
        course = FootballCourse.objects.select_for_update().get(id=self.course.id)
        
        user_id = self.user.id
        course_id = self.course.id
        enrollment_id = self.pk
        
        # Only decrement if this enrollment was counted in current_participants
        was_counted = self.enrollment_status in [
            self.EnrollmentStatus.WAITING_FOR_PAYMENT,
            self.EnrollmentStatus.CONFIRMED
        ]
        
        result = super().delete(*args, **kwargs)
        
        if was_counted:
            course.current_participants = max(0, course.current_participants - 1)
            course.save(update_fields=['current_participants', 'status'])
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, enrollment_id)
        cache.delete(f"football_user:{user_id}:enrollments")
        cache.delete(f"football_user:{user_id}:active_enrollments")
        cache.delete(f"football_course:{course_id}:enrollments")
        cache.delete(f"football_course:capacity:{course_id}")
        cache.delete("football_enrollments:all_list")
        cache.delete("football_enrollments:active_list")
        
        return result