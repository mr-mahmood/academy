from django.db import models
from core.exceptions import APIError, SportError
from core.cache_service import CacheService
from django.core.cache import cache

class Sport(models.Model):
    id:int
    
    name = models.CharField(max_length=100, unique=True, verbose_name="Sport Name")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "sports"
        ordering = ['name']
        verbose_name = "Sport"
        verbose_name_plural = "Sports"

        indexes = [
            models.Index(fields=['created_at'])
        ]
    
    def __str__(self):
        return self.name

    @classmethod
    def get_sport(cls, id: int) -> 'Sport':
        sport = CacheService.get_model(cls, id, timeout=CacheService.LONG_TIMEOUT)
        if not sport:
            raise APIError(SportError.SPORT_NOT_EXIST)
        return sport

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Clear individual cache
        CacheService.invalidate_model(self.__class__, self.pk)
        
        # Clear list cache if needed
        cache.delete("sports:all_list")
    
    def delete(self, *args, **kwargs):
        sport_id = self.pk
        super().delete(*args, **kwargs)
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, sport_id)
        cache.delete("sports:all_list")