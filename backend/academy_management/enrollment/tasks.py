# academy_management/enrollment/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import transaction

from users.models import User
from .models import Enrollment
from core.sms_task import send_payment_reminder_sms_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_waiting_payments_and_send_reminders():
    """
    Check for WAITING_FOR_PAYMENT enrollments every 24 hours.
    Send reminders up to 3 times, then cancel on 4th attempt.
    """
    # Find all enrollments waiting for payment
    waiting_enrollments = Enrollment.objects.filter(
        enrollment_status=Enrollment.EnrollmentStatus.WAITING_FOR_PAYMENT
    ).select_related('user', 'course__sport', 'course__academy')
    
    reminder_sent = 0
    cancelled_count = 0
    
    for enrollment in waiting_enrollments:
        with transaction.atomic():
            # Lock the enrollment to prevent race conditions
            enrollment = Enrollment.objects.select_for_update().get(pk=enrollment.pk)
            
            # Check if already cancelled or confirmed (double-check)
            if enrollment.enrollment_status != Enrollment.EnrollmentStatus.WAITING_FOR_PAYMENT:
                continue
            
            # Check if interval has passed since last reminder (or since enrollment)
            if enrollment.last_reminder_at:
                time_since_last = timezone.now() - enrollment.last_reminder_at
            else:
                time_since_last = timezone.now() - enrollment.updated_at
            
            # Only send reminder if interval has passed (24 hours)
            if time_since_last >= timedelta(hours=23): # for errro time and a gap we use 23 hours
                
                if enrollment.reminder_count < 3:
                    # Send reminder SMS
                    user: User = enrollment.user
                    course = enrollment.course
                    
                    full_name = f"{user.full_name}".strip()
                    sport_name = course.sport.name
                    academy_name = course.academy.name
                    
                    # Send reminder
                    send_payment_reminder_sms_task.delay(
                        phone_number=user.phone_number,
                        full_name=full_name,
                        sport_name=sport_name,
                        academy_name=academy_name
                    )
                    
                    # Update reminder count and timestamp
                    enrollment.reminder_count += 1
                    enrollment.last_reminder_at = timezone.now()
                    enrollment.save(update_fields=['reminder_count', 'last_reminder_at', 'updated_at'])
                    
                    reminder_sent += 1
                    logger.info(f"Sent reminder #{enrollment.reminder_count} to enrollment {enrollment.id}")
                    
                else:
                    # 4th attempt - cancel the enrollment
                    enrollment.enrollment_status = Enrollment.EnrollmentStatus.CANCELLED
                    enrollment.cancelled_at = timezone.now()
                    # Reset reminder count (for potential future reactivation)
                    enrollment.reminder_count = 0
                    enrollment.last_reminder_at = None
                    enrollment.save(update_fields=['enrollment_status', 'cancelled_at', 'reminder_count', 'last_reminder_at', 'updated_at'])
                    
                    cancelled_count += 1
                    logger.info(f"Cancelled enrollment {enrollment.id} after 3 unpaid reminders")
    
    if reminder_sent or cancelled_count:
        logger.info(f"Sent {reminder_sent} reminders, cancelled {cancelled_count} enrollments")
    
    return {"reminders_sent": reminder_sent, "cancelled": cancelled_count}