# core/cache_service.py
from django.core.cache import cache
from django.db.models import Model
from typing import Optional, Any, List
import json
import hashlib

class CacheService:
    """Generic cache service for models"""
    
    DEFAULT_TIMEOUT = 3600  # 1 hour
    LONG_TIMEOUT = 28800    # 8 hours
    SHORT_TIMEOUT = 600     # 10 minutes
    
    @classmethod
    def get_cache_key(cls, model_name: str, identifier: Any, prefix: str = "model") -> str:
        """Generate consistent cache key"""
        return f"{prefix}:{model_name}:{identifier}"
    
    @classmethod
    def get_model(cls, model_class, identifier, timeout=DEFAULT_TIMEOUT):
        """Get model instance from cache or database"""
        cache_key = cls.get_cache_key(model_class.__name__, identifier)
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        # Get from database
        try:
            instance = model_class.objects.get(id=identifier)
            # Store in cache
            cache.set(cache_key, instance, timeout)
            return instance
        except model_class.DoesNotExist:
            return None
    
    @classmethod
    def get_list(cls, model_class, query_func, cache_key: str, timeout=DEFAULT_TIMEOUT):
        """Cache list of model instances"""
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        result = query_func()
        cache.set(cache_key, result, timeout)
        return result
    
    @classmethod
    def invalidate_model(cls, model_class, identifier):
        """Clear cache for a specific model instance"""
        cache_key = cls.get_cache_key(model_class.__name__, identifier)
        cache.delete(cache_key)
    
    @classmethod
    def invalidate_list(cls, *cache_keys):
        """Clear multiple list caches"""
        cache.delete_many(cache_keys)
    
    @classmethod
    def invalidate_all(cls):
        """Clear multiple list caches"""
        cache.clear()