from django.apps import AppConfig
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        """Clear cache when the application starts"""
        from core.cache_service import CacheService
        
        # Clear all cache on startup
        try:
            CacheService.invalidate_all()
            logger.info("Cache cleared successfully on application startup")
        except Exception as e:
            logger.error(f"Failed to clear cache on startup: {e}")