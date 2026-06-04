# football_talent/courses/models.py
from django.db import models
from django.utils import timezone
from core.exceptions import APIError, ClassError
from core.cache_service import CacheService
from django.core.cache import cache
from football_talent.academies.models import FootballAcademy


class FootballCourse(models.Model):
    """Football talent test - age category is NOT stored here anymore"""
    id: int
    
    class GenderRequirement(models.TextChoices):
        MALE = 'MALE', 'Male Only'
        FEMALE = 'FEMALE', 'Female Only'

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
    
    # Position (no age category here)
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
        ordering = ['position', 'academy']
        verbose_name = "Football Course"
        verbose_name_plural = "Football Courses"
        
        # Unique together: one course per academy, position, and gender
        unique_together = [['academy', 'position', 'gender_requirement']]
        
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['academy', 'status']),
            models.Index(fields=['position']),
        ]

    def __str__(self):
        return f"{self.id}. {self.academy.name} - {self.position}"
    
    @classmethod
    def get_course(cls, id: int) -> 'FootballCourse':
        """Get football course by ID with caching"""
        course = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not course:
            raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
        return course
    
    def save(self, *args, **kwargs):        
        super().save(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{self.pk}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{self.position}")
    
    def delete(self, *args, **kwargs):
        course_id = self.pk
        position = self.position
        
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, course_id)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{course_id}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{position}")