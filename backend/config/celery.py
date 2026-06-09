# config/celery.py
import os
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta

# ============================================
# CELERY INITIALIZATION
# ============================================

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('academy')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# ============================================
# BEAT SCHEDULE CONFIGURATION
# ============================================

class BeatSchedule:
    """Centralized beat schedule configuration"""
    
    # User Module Tasks
    USER = {
        'update-user-age-categories': {
            'task': 'users.tasks.update_all_users_age_categories',
            'schedule': crontab(minute=0, hour=3),
            # 'description': 'Update age categories for all users',
        },
    }
    
    # Academy Module Tasks
    ACADEMY = {
        'academy-check-waiting-payments': {
            'task': 'academy_management.enrollment.tasks.check_waiting_payments_and_send_reminders',
            'schedule': crontab(minute=30, hour='12,16,20'), 
            # These run at: 12:30 PM, 4:30 PM, and 8:30 PM Iran time
            # UTC times: 9,13,17
        },
    }
    
    # Football Module Tasks
    FOOTBALL = {
        'football-cleanup-payments': {
            'task': 'football_talent.enrollment.tasks.cleanup_expired_waiting_payments',
            'schedule': crontab(minute=10, hour='*/2'),
            # 'description': 'Cleanup expired football payments',
        },
    }


# Apply all schedules
app.conf.beat_schedule = {}
app.conf.beat_schedule.update(BeatSchedule.USER)
app.conf.beat_schedule.update(BeatSchedule.ACADEMY)
app.conf.beat_schedule.update(BeatSchedule.FOOTBALL)


# ============================================
# DEBUG TASK
# ============================================

@app.task(bind=True)
def debug_task(self):
    """Debug task to verify Celery is working"""
    print(f'Request: {self.request!r}')