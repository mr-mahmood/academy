from django.db import models
from core.exceptions import APIError, AcademyError
from core.cache_service import CacheService
from django.core.cache import cache


class FootballAcademy(models.Model):
    id: int
    
    class City(models.TextChoices):
        ISFAHAN = 'ISFAHAN', 'اصفهان'
        GORGAN = 'GORGAN', 'گرگان'
        RAMHORMOZ = 'RAMHORMOZ', 'رامهرمز'
        KERMAN = 'KERMAN', 'کرمان'
        KERMANSHAH = 'KERMANSHAH', 'کرمانشاه'
        BABOL = 'BABOL', 'بابل'
        GILAN = 'GILAN', 'گیلان'
        DOROUD = 'DOROUD', 'دورود'
    
    name = models.CharField(max_length=200, verbose_name="Football Academy Name")
    
    city = models.CharField(
        max_length=50,
        choices=City.choices,
        default=City.ISFAHAN,
        verbose_name="City",
        db_index=True
    )
    
    address_text = models.TextField(blank=True, null=True, verbose_name="Address")
    
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, verbose_name="Longitude")
    
    instructor_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Instructor")
    instructor_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Instructor Phone Number")
    
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "football_academies"
        verbose_name = "Football Academy"
        verbose_name_plural = "Football Academies"
        
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['name']),
            models.Index(fields=['city']),
            models.Index(fields=['is_active', 'city']),
            models.Index(fields=['is_active', 'name']),
            models.Index(fields=['city', 'name']),
        ]
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_football_academy(cls, id: int) -> 'FootballAcademy':
        """Get football academy by ID with caching"""
        academy = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not academy:
            raise APIError(AcademyError.FOOTBALL_ACADEMY_NOT_EXIST)
        return academy
    
    @classmethod
    def get_academies_by_city(cls, city: str):
        """Get all active academies in a specific city with caching"""
        cache_key = f"football_academies:city:{city}"
        
        return CacheService.get_list(
            model_class=cls,
            query_func=lambda: list(cls.objects.filter(city=city).order_by('name')),
            cache_key=cache_key,
            timeout=CacheService.LONG_TIMEOUT
        )
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Clear individual cache
        CacheService.invalidate_model(self.__class__, self.pk)
        
        # Clear list caches
        cache.delete("football_academies:active_list")
        cache.delete("football_academies:all_list")
        cache.delete(f"football_academies:city:{self.city}")
    
    def delete(self, *args, **kwargs):
        academy_id = self.pk
        city = self.city
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, academy_id)
        cache.delete("football_academies:active_list")
        cache.delete("football_academies:all_list")
        cache.delete(f"football_academies:city:{city}")