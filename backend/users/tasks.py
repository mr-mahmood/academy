# academy_management/users/tasks.py
from celery import shared_task
from football_talent.enrollment.models import FootballEnrollment
from users.models import User
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_all_users_age_categories():
    """Update age categories for all users"""
    users = User.objects.all()
    updated_count = 0
    
    for user in users:
        old_category = user.age_category
        new_category = user.calculate_age_category()
        
        if old_category != new_category:
            user.age_category = new_category
            user.save(update_fields=['age_category', 'updated_at'])
            FootballEnrollment.update_all_enrollments_for_user(user)
            updated_count += 1
    
    logger.info(f"Updated age categories for {updated_count} users")
    return updated_count