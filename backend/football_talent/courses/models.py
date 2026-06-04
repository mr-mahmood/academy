from django.db import models
from django.utils import timezone
from datetime import timedelta
from datetime import datetime
from core.exceptions import APIError, ClassError
from core.cache_service import CacheService
from django.core.cache import cache
from football_talent.academies.models import FootballAcademy


class FootballCourse(models.Model):
    """Football talent test - equivalent to Course"""
    id: int
    
    class GenderRequirement(models.TextChoices):
        MALE = 'MALE', 'Male Only'
        FEMALE = 'FEMALE', 'Female Only'
    
    class AgeCategory(models.TextChoices):
        U12 = "U12", "U12"
        U13 = "U13", "U13"
        U14 = "U14", "U14"
        U15 = "U15", "U15"
        U17 = "U17", "U17"
        U18 = "U18", "U18"
        YOUTH = "YOUTH", "جوانان"
        U21 = "U21", "امید"

    class Position(models.TextChoices):
        GOALKEEPER = 'GK', 'دروازه بان'
        CENTER_BACK = 'CB', 'مدافع میانی'
        LEFT_BACK = 'LB', 'مدافع چپ'
        RIGHT_BACK = 'RB', 'مدافع راست'
        CENTER_MID = 'CM', 'هافبک وسط'
        RIGHT_WING = 'RW', 'وینگر راست'
        LEFT_WING = 'LW', 'وینگر چپ'
        STRIKER = 'ST', 'مهاجم'
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        FULL = 'FULL', 'Full'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
    
    # Relations
    academy = models.ForeignKey(
        FootballAcademy,
        on_delete=models.CASCADE,
        related_name='football_courses',
        verbose_name="Football Academy"
    )
    
    # Coach info
    coache = models.TextField(blank=True, null=True, verbose_name="Coach")
    
    # Age category and position
    age_category = models.CharField(
        max_length=20,
        choices=AgeCategory.choices,
        verbose_name="Age Category"
    )
    
    position = models.CharField(
        max_length=20,
        choices=Position.choices,
        verbose_name="Position"
    )
    
    gender_requirement = models.CharField(
        max_length=10,
        choices=GenderRequirement.choices,
        default=GenderRequirement.MALE,
        verbose_name="Gender Requirement"
    )
    
    # Schedule (with start and end time)
    test_date = models.DateField(verbose_name="Test Date", null=True)
    start_time = models.TimeField(verbose_name="Start Time", null=True)
    end_time = models.TimeField(verbose_name="End Time", null=True) 
    
    # Capacity
    max_participants = models.PositiveIntegerField(
        default=30,
        verbose_name="Maximum Participants"
    )
    
    current_participants = models.PositiveIntegerField(
        default=0,
        verbose_name="Current Participants"
    )
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=0,
        default=4_500_000,
        verbose_name="Test Fee (Rial)"
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
        db_table = "football_courses"
        ordering = ['-created_at']
        verbose_name = "Football Course"
        verbose_name_plural = "Football Courses"
        
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['test_date']),
            models.Index(fields=['academy', 'status']),
            models.Index(fields=['position', 'age_category']),
            models.Index(fields=['age_category']),
            models.Index(fields=['status', 'test_date']),
            models.Index(fields=['academy', 'status', 'test_date']),
            models.Index(fields=['test_date', 'start_time']),
        ]

    def __str__(self):
        return f"{self.id}. {self.academy.name} - {self.position} - {self.age_category}"
    
    @property
    def available_seats(self) -> int:
        """Number of seats still available"""
        return self.max_participants - self.current_participants
    
    @property
    def is_full(self) -> bool:
        """Check if test is at maximum capacity"""
        return self.current_participants >= self.max_participants
    
    def has_time_conflict(self, other_course) -> bool:
        """
        Check if this course conflicts with another course.
        Returns True if dates overlap and times overlap.
        """
        if self.test_date != other_course.test_date:
            return False
        
        # Check if time ranges overlap
        return not (self.end_time <= other_course.start_time or 
                   self.start_time >= other_course.end_time)
    
    @classmethod
    def get_course(cls, id: int) -> 'FootballCourse':
        """Get football course by ID with caching"""
        course = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not course:
            raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
        return course
    
    def save(self, *args, **kwargs):
        # Validate time range
        if self.start_time >= self.end_time:
            raise APIError(ClassError.INVALID_TIME_RANGE)
        
        # Auto-update status based on capacity and dates
        now = timezone.now()
        
        if self.status != self.Status.CANCELLED and self.status != self.Status.COMPLETED:
            if self.is_full:
                self.status = self.Status.FULL
        
        super().save(*args, **kwargs)
        
        # Clear caches
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{self.pk}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{self.position}")
        cache.delete(f"football_courses:date:{self.test_date}")
    
    def delete(self, *args, **kwargs):
        course_id = self.pk
        position = self.position
        test_date = self.test_date
        
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, course_id)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{course_id}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{position}")
        cache.delete(f"football_courses:date:{test_date}")