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
                
                # Check for existing enrollment
                if FootballEnrollment.objects.filter(user=self.user, course=self.course).exists():
                    raise APIError(RegistrationError.FOOTBALL_COURSE_ALREADY_ENROLLED)
                
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