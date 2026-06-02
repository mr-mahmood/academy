from django.db import models
from core.exceptions import APIError, AcademyError
from core.cache_service import CacheService
from django.core.cache import cache


class Academy(models.Model):
    id:int
    
    name = models.CharField(max_length=200, verbose_name="Academy Name")
    address_text = models.TextField(blank=True, null=True, verbose_name="Address")
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, verbose_name="Longitude")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Phone Number")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "academies"
        ordering = ['name']
        verbose_name = "Academy"
        verbose_name_plural = "Academies"
    
    
        indexes = [
            # 🔥 ADD THESE INDEXES
            # Active filtering (most common)
            models.Index(fields=['is_active']),
            
            # Name searches
            models.Index(fields=['name']),
            
            # Composite for active academies ordered by name
            models.Index(
                fields=['is_active', 'name']
            ),
        ]
    
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_academy(cls, id: int) -> 'Academy':
        academy = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not academy:
            raise APIError(AcademyError.ACADEMY_NOT_EXIST)
        return academy
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Clear individual cache
        CacheService.invalidate_model(self.__class__, self.pk)
        
        # Clear list caches
        cache.delete("academies:active_list")
        cache.delete("academies:all_list")
    
    def delete(self, *args, **kwargs):
        academy_id = self.pk
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, academy_id)
        cache.delete("academies:active_list")
        cache.delete("academies:all_list")
