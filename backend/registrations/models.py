from django.db import models
from users.models import User
from courses.models import Course, CourseSchedule
from core.exceptions import APIError, RegistrationError
from core.cache_service import CacheService
from django.core.cache import cache
from django.db import transaction


class Enrollment(models.Model):
    """User enrollment in a course"""
    id:int
    
    class EnrollmentStatus(models.TextChoices):
        WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT', 'Waiting for Payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    
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
        db_table = "enrollments"
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
        return f"{self.user.full_name} - {self.course.academy.name} - {self.course.sport.name}"
    
    def check_time_conflict(self):
        """
        Check if this enrollment conflicts with existing enrollments.
        Uses a single optimized database query.
        """
        from django.db.models import Q, Exists, OuterRef
        
        # Subquery to get all schedules of the new course
        new_schedule_subquery = CourseSchedule.objects.filter(
            course=self.course,
            weekday=OuterRef('weekday'),
            start_time__lt=OuterRef('end_time'),
            end_time__gt=OuterRef('start_time')
        )
        
        # Check if any existing enrollment has a time conflict
        return CourseSchedule.objects.filter(
            # Existing schedules for user's active enrollments
            course__enrollments__user=self.user,
            course__enrollments__enrollment_status__in=[
                self.EnrollmentStatus.WAITING_FOR_PAYMENT,
                self.EnrollmentStatus.CONFIRMED
            ]
        ).exclude(
            # Exclude current enrollment if updating
            course__enrollments__pk=self.pk if self.pk else None
        ).filter(
            # Must have overlapping schedule with new course
            Exists(new_schedule_subquery)
        ).exists()
    
    @classmethod
    def get_enrollment(cls, id: int, user=None) -> 'Enrollment':
        """Get enrollment by ID with caching"""
        enrollment = CacheService.get_model(cls, id, timeout=CacheService.DEFAULT_TIMEOUT)
        if not enrollment:
            raise APIError(RegistrationError.ENROLLMENT_NOT_FOUND)
        
        if user and enrollment.user.id != user.id:
            raise APIError(RegistrationError.ENROLLMENT_NOT_FOUND)
        
        return enrollment
    
    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        # Track status changes
        was_cancelled = False
        was_reactivated = False
        
        if not is_new:
            try:
                old = Enrollment.objects.get(pk=self.pk)
                # Check if status changed to CANCELLED
                if old.enrollment_status != self.EnrollmentStatus.CANCELLED and self.enrollment_status == self.EnrollmentStatus.CANCELLED:
                    was_cancelled = True
                # Check if status changed from CANCELLED to active (WAITING_FOR_PAYMENT or CONFIRMED)
                if old.enrollment_status == self.EnrollmentStatus.CANCELLED and self.enrollment_status in [
                    self.EnrollmentStatus.WAITING_FOR_PAYMENT,
                    self.EnrollmentStatus.CONFIRMED
                ]:
                    was_reactivated = True
            except Enrollment.DoesNotExist:
                pass
        
        # Lock the course row for update
        if is_new or was_reactivated:
            self.course = Course.objects.select_for_update().get(id=self.course.id)
            
            if is_new:
                # Check capacity
                if self.course.is_full:
                    raise APIError(RegistrationError.COURSE_FULL)
                
                # Check if course is active
                if self.course.status != Course.Status.ACTIVE:
                    raise APIError(RegistrationError.COURSE_NOT_ACTIVE)
                
                # Check gender requirement
                if self.course.gender_requirement == Course.GenderRequirement.MALE and self.user.gender != Course.GenderRequirement.MALE:
                    raise APIError(RegistrationError.GENDER_MISMATCH)
                if self.course.gender_requirement == Course.GenderRequirement.FEMALE and self.user.gender != Course.GenderRequirement.FEMALE:
                    raise APIError(RegistrationError.GENDER_MISMATCH)
                
                # Check for existing enrollment
                if Enrollment.objects.filter(user=self.user, course=self.course).exists():
                    raise APIError(RegistrationError.ALREADY_ENROLLED)
                
                # Check for time conflict
                if self.check_time_conflict():
                    raise APIError(RegistrationError.TIME_CONFLICT)
                
                # Increment enrolled students for new enrollment
                self.course.enrolled_students += 1
                self.course.save(update_fields=['enrolled_students', 'status'])
            
            elif was_reactivated:
                # Reactivating a cancelled enrollment - increment count again
                self.course.enrolled_students += 1
                self.course.save(update_fields=['enrolled_students', 'status'])
                # Clear cancelled_at timestamp
                self.cancelled_at = None
        
        # Handle cancellation - decrement count
        if was_cancelled:
            if not self.cancelled_at:
                from django.utils import timezone
                self.cancelled_at = timezone.now()
            
            # Lock and decrement course count
            course = Course.objects.select_for_update().get(id=self.course.id)
            course.enrolled_students = max(0, course.enrolled_students - 1)
            course.save(update_fields=['enrolled_students', 'status'])
        
        super().save(*args, **kwargs)
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete(f"user:{self.user.id}:enrollments")
        cache.delete(f"user:{self.user.id}:active_enrollments")
        cache.delete(f"course:{self.course.id}:enrollments")
        cache.delete(f"course:capacity:{self.course.id}")
        cache.delete("enrollments:all_list")
        cache.delete("enrollments:active_list")
    
    @transaction.atomic   
    def delete(self, *args, **kwargs):
        course = Course.objects.select_for_update().get(id=self.course.id)
        
        user_id = self.user.id
        course_id = self.course.id
        enrollment_id = self.pk
        
        # Only decrement if this enrollment was counted in enrolled_students
        was_counted = self.enrollment_status in [
            self.EnrollmentStatus.WAITING_FOR_PAYMENT,
            self.EnrollmentStatus.CONFIRMED
        ]
        
        result = super().delete(*args, **kwargs)
        
        if was_counted:
            course.enrolled_students = max(0, course.enrolled_students - 1)
            course.save(update_fields=['enrolled_students', 'status'])
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, enrollment_id)
        cache.delete(f"user:{user_id}:enrollments")
        cache.delete(f"user:{user_id}:active_enrollments")
        cache.delete(f"course:{course_id}:enrollments")
        cache.delete(f"course:capacity:{course_id}")
        cache.delete("enrollments:all_list")
        cache.delete("enrollments:active_list")
        
        return result