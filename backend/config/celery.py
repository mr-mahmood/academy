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
            'schedule': crontab(minute=0, hour=3, day_of_week='sunday'),
            'description': 'Update age categories for all users',
        },
        'send-daily-birthday-wishes': {
            'task': 'academy_management.users.tasks.send_daily_birthday_wishes',
            'schedule': crontab(hour=9, minute=0),
            'description': 'Send birthday wishes to users',
        },
    }
    
    # Academy Module Tasks
    ACADEMY = {
        'academy-check-waiting-payments': {
            'task': 'academy_management.enrollment.tasks.check_waiting_payments_and_send_reminders',
            'schedule': timedelta(hours=24, minutes=10),  # Every 24 hours and 10 minutes
            'description': 'Send payment reminders every 24 hours up to 3 times, then cancel',
        },
    }
    
    # Football Module Tasks
    FOOTBALL = {
        'football-cleanup-payments': {
            'task': 'football_talent.enrollment.tasks.cleanup_expired_waiting_payments',
            'schedule': crontab(minute=10, hour='*/2'),
            'description': 'Cleanup expired football payments',
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