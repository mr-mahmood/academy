# apps/classes/models.py
from django.db import models
from academy_management.sports.models import Sport
from academy_management.academies.models import Academy
from core.exceptions import APIError, ClassError
from core.cache_service import CacheService
from django.core.cache import cache


class Course(models.Model):
    id:int
    
    class GenderRequirement(models.TextChoices):
        MALE = 'MALE', 'Male Only'
        FEMALE = 'FEMALE', 'Female Only'
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        FULL = 'FULL', 'Full'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
    
    # Relations
    sport = models.ForeignKey(
        Sport, 
        on_delete=models.CASCADE, 
        related_name='courses',
        verbose_name="Sport"
    )
    academy = models.ForeignKey(
        Academy, 
        on_delete=models.CASCADE, 
        related_name='courses',
        verbose_name="Academy"
    )
    
    # Basic info
    instructor_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Instructor")
    
    # Capacity
    total_sessions = models.PositiveIntegerField(
        default=12,
        verbose_name="Total Sessions",
    )
    max_students = models.PositiveIntegerField(
        default=30, 
        verbose_name="Maximum Students"
    )
    enrolled_students = models.PositiveIntegerField(
        default=0, 
        verbose_name="Enrolled Students",
    )
    
    # Pricing & Requirements
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=0, 
        default=20_000_000,
        verbose_name="Price (Rial)"
    )
    
    gender_requirement = models.CharField(
        max_length=10,
        choices=GenderRequirement.choices,
        default=GenderRequirement.MALE,
        verbose_name="Gender Requirement"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Status"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "courses"
        verbose_name = "Course"
        verbose_name_plural = "Courses"
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['sport']),
            models.Index(fields=['academy']),
            models.Index(fields=['gender_requirement']),
            
            # Composite index for active courses ordered by date (most common query)
            models.Index(
                fields=['status', '-created_at']
            ),
            
            # Composite for sport + status
            models.Index(
                fields=['sport', 'status']
            ),
            
            # Composite for academy + status  
            models.Index(
                fields=['academy', 'status']
            ),
        ]

    def __str__(self):
        return f"{self.id}. {self.sport.name}-{self.academy.name}"
    
    @property
    def available_seats(self) -> int:
        """Number of seats still available"""
        return self.max_students - self.enrolled_students
    
    @property
    def is_full(self) -> bool:
        """Check if course is at maximum capacity"""
        return self.enrolled_students >= self.max_students
    
    @property
    def can_register(self) -> bool:
        """Check if registration is possible"""
        return self.status == self.Status.ACTIVE and not self.is_full
    
    @classmethod
    def get_course(cls, id: int) -> 'Course':
        """Get course by ID with caching (shorter timeout for dynamic data)"""
        course = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not course:
            raise APIError(ClassError.CLASS_NOT_EXIST)
        return course
    
    def save(self, *args, **kwargs):
        # Auto-update status based on enrollment
        if self.is_full:
            self.status = self.Status.FULL
        elif self.status == self.Status.FULL and not self.is_full:
            self.status = self.Status.ACTIVE
        super().save(*args, **kwargs)
        
        # Clear individual course cache
        CacheService.invalidate_model(self.__class__, self.pk)
        
        # Clear list caches
        cache.delete("courses:active_list")
        cache.delete("courses:all_list")
        
        # Also clear related course detail cache
        cache.delete(f"course:detail:{self.pk}")
    
    def delete(self, *args, **kwargs):
        course_id = self.pk
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, course_id)
        cache.delete("courses:active_list")
        cache.delete("courses:all_list")
        cache.delete(f"course:detail:{course_id}")
        cache.delete(f"course:{self.id}:enrollments")
        print(f"✅ Course {course_id} cache cleared (deleted)")


class CourseSchedule(models.Model):
    """
    Weekly schedule for a course.
    Supports multiple days per week (e.g., Monday and Wednesday)
    """
    id:int
    
    class Weekday(models.IntegerChoices):
        SATURDAY = 0, 'Saturday'
        SUNDAY = 1, 'Sunday'
        MONDAY = 2, 'Monday'
        TUESDAY = 3, 'Tuesday'
        WEDNESDAY = 4, 'Wednesday'
        THURSDAY = 5, 'Thursday'
        FRIDAY = 6, 'Friday'
    
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='schedule',
        verbose_name="Course"
    )
    weekday = models.IntegerField(
        choices=Weekday.choices, 
        verbose_name="Day of Week"
    )
    start_time = models.TimeField(verbose_name="Start Time")
    end_time = models.TimeField(verbose_name="End Time")
    
    class Meta:
        db_table = "course_schedules"
        ordering = ['weekday', 'start_time', 'course']
        unique_together = [['course', 'weekday', 'start_time']]
        verbose_name = "Course Schedule"
        verbose_name_plural = "Course Schedules"
    
    def __str__(self):
        weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        return f"{weekdays[self.weekday]} {self.start_time}-{self.end_time}"
    
    @property
    def weekday_name(self):
        weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        return weekdays[self.weekday]