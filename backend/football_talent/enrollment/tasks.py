from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import FootballEnrollment
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_waiting_payments():
    """Cancel WAITING_FOR_PAYMENT enrollments older than 2 hours"""
    expiry_time = timezone.now() - timedelta(hours=2)
    
    expired_enrollments = FootballEnrollment.objects.filter(
        enrollment_status=FootballEnrollment.EnrollmentStatus.WAITING_FOR_PAYMENT,
        updated_at__lt=expiry_time
    )
    
    count = 0
    for enrollment in expired_enrollments:
        with transaction.atomic():
            enrollment.enrollment_status = FootballEnrollment.EnrollmentStatus.CANCELLED
            enrollment.cancelled_at = timezone.now()
            enrollment.save()
            count += 1
    
    if count:
        logger.info(f"FootballEnrollment Cleaned up {count} expired WAITING_FOR_PAYMENT enrollments")
    
    return count