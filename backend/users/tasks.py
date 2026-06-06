# academy_management/users/tasks.py
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from users.models import User
import logging

logger = logging.getLogger(__name__)

# @shared_task
# def send_daily_birthday_wishes():
#     today = timezone.now().date()
    
#     # Find users with birthday today
#     birthday_users = User.objects.filter(
#         birth_date__isnull=False,
#         is_active=True,
#         birth_date__month=today.month,
#         birth_date__day=today.day
#     )
    
#     for user in birthday_users:
#         full_name = f"{user.first_name} {user.last_name}".strip() or ""
#         send_birthday_wishes_sms_task.delay(user.phone_number, full_name)
#         logger.info(f"Birthday wish sent to {user.phone_number}")
    
#     return f"Sent {birthday_users.count()} birthday wishes"