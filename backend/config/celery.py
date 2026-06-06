# config/celery.py
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('academy')

# Load config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ============================================
# BEAT SCHEDULE - Periodic Tasks
# ============================================

# Payment Cleanup Tasks (Every 2 hours)
PAYMENT_CLEANUP_SCHEDULE = {
    'academy-cleanup-expired-payments': {
        'task': 'academy_management.enrollment.tasks.cleanup_expired_waiting_payments',
        'schedule': crontab(minute='0', hour='*/2'),
        'description': 'Clean up expired academy payment enrollments every 2 hours',
    },
    'football-cleanup-expired-payments': {
        'task': 'football_talent.enrollment.tasks.cleanup_expired_waiting_payments',
        'schedule': crontab(minute='10', hour='*/2'),
        'description': 'Clean up expired football payment enrollments every 2 hours',
    },
}

# User Maintenance Tasks
USER_MAINTENANCE_SCHEDULE = {
    'update-all-users-age-categories': {
        'task': 'users.tasks.update_all_users_age_categories',
        'schedule': crontab(minute='0', hour='3', day_of_week='sunday'),
        'description': 'Update age categories for all users - Weekly Sunday 3 AM',
    },
}

# Combine all schedules
app.conf.beat_schedule = {}
app.conf.beat_schedule.update(PAYMENT_CLEANUP_SCHEDULE)
app.conf.beat_schedule.update(USER_MAINTENANCE_SCHEDULE)

# ============================================
# TASKS
# ============================================

@app.task(bind=True)
def debug_task(self):
    """Debug task to verify Celery is working"""
    print(f'Request: {self.request!r}')