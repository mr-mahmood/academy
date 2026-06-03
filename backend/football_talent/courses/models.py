from django.db import models
from django.utils import timezone
from datetime import timedelta
from core.exceptions import APIError, ClassError
from core.cache_service import CacheService
from django.core.cache import cache
from football_talent.academies.models import FootballAcademy


class FootballCourse(models.Model):
    """Football talent test - equivalent to Course"""
    id: int
    
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
    coache = models.TextField(blank=True, null=True, verbose_name="Coache")
    
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
    
    # Schedule (removed registration_deadline, just test_date)
    test_date = models.DateTimeField(verbose_name="Test Date")
    
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
    
    @property
    def can_register(self) -> bool:
        """Check if registration is possible"""
        now = timezone.now()
        return (
            self.status == self.Status.ACTIVE and
            not self.is_full and
            now < self.test_date
        )
    
    @property
    def is_upcoming(self) -> bool:
        """Check if test is in the future"""
        return timezone.now() < self.test_date
    
    @property
    def is_past(self) -> bool:
        """Check if test has passed"""
        return timezone.now() > self.test_date
    
    @classmethod
    def get_course(cls, id: int) -> 'FootballCourse':
        """Get football course by ID with caching"""
        course = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not course:
            raise APIError(ClassError.CLASS_NOT_EXIST)
        return course
    
    def save(self, *args, **kwargs):
        # Auto-update status based on capacity and dates
        now = timezone.now()
        
        if self.status != self.Status.CANCELLED and self.status != self.Status.COMPLETED:
            if self.is_full:
                self.status = self.Status.FULL
            elif now > self.test_date:
                self.status = self.Status.COMPLETED
        
        super().save(*args, **kwargs)
        
        # Clear caches
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{self.pk}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{self.position}")
    
    def delete(self, *args, **kwargs):        
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete("football_courses:active_list")
        cache.delete("football_courses:all_list")
        cache.delete(f"football_course:detail:{self.pk}")
        cache.delete(f"football_courses:academy:{self.academy.id}")
        cache.delete(f"football_courses:position:{self.position}")