from django.db import models
from django.utils import timezone
from registrations.models import Enrollment
from core.exceptions import APIError, PaymentError


class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PAID = 'PAID', 'Paid'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REVERSED = 'REVERSED', 'Reversed'


class Payment(models.Model):
    id: int
    
    enrollment = models.OneToOneField(
        Enrollment, 
        on_delete=models.SET_NULL,
        related_name='payment',
        verbose_name="Enrollment",
        null=True
    )
    
    amount = models.BigIntegerField(
        verbose_name='Amount (Rials)',
        help_text="Payment amount in Rials"
    )
    
    wage = models.BigIntegerField(
        default=0,
        verbose_name='Fee',
        help_text="Gateway fee/wage in Rials"
    )
    
    description = models.TextField(
        editable=False,
        verbose_name='Payment Description',
        default=''
    )
    
    track_id = models.BigIntegerField(
        unique=True, 
        null=True, 
        blank=True, 
        verbose_name='Zibal Track ID',
        help_text="Zibal's internal transaction tracking ID"
    )

    ref_num = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        unique=True,
        verbose_name='Reference Number',
        help_text="Zibal's reference number (Authority) after successful payment"
    )
    
    res_num = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name='Order Number',
        help_text="Your system's unique order number for this payment"
    )
    
    masked_pan = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name='Masked PAN',
        help_text="Masked card number (e.g., 621986******1234)"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=PaymentStatus.choices, 
        default=PaymentStatus.PENDING,
        verbose_name="Payment Status"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created At"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At"
    )
    
    paid_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="Paid At",
        help_text="Timestamp when payment was successfully completed"
    )
    
    class Meta:
        ordering = ['-created_at']
        db_table = "payments"
        
        indexes = [
            models.Index(fields=['status'], name='idx_payment_status'),
            models.Index(fields=['enrollment'], name='idx_payment_enrollment'),
            models.Index(fields=['ref_num'], name='idx_payment_ref_num'),
            models.Index(fields=['res_num'], name='idx_payment_res_num'),
            models.Index(fields=['created_at'], name='idx_payment_created'),
            models.Index(fields=['paid_at'], name='idx_payment_paid_at'),
            models.Index(
                fields=['status', '-created_at'],
                name='idx_payment_status_created'
            ),
        ]
    
    def __str__(self):
        return f"Payment {self.res_num} - {self.amount:,} Rials - {self.status}"
    
    @property
    def user(self):
        return self.enrollment.user if self.enrollment else None
    
    @property
    def course(self):
        return self.enrollment.course if self.enrollment else None
    
    @property
    def amount_in_toman(self):
        return self.amount // 10
    
    def _update_pending_amount_from_course(self):
        """Update amount from course price only if payment is pending"""
        if self.status == PaymentStatus.PENDING:
            if self.enrollment and self.enrollment.course:
                current_course_price = self.enrollment.course.price
                if self.amount != current_course_price:
                    self.amount = current_course_price
                    return True
        return False
    
    def _generate_description(self):
        user = self.enrollment.user
        course = self.enrollment.course
        paid_message = self.paid_at.strftime('%Y-%m-%d %H:%M:%S') if self.paid_at else 'Not paid yet'
        
        description = (
            f"Payment for course enrollment:\n"
            f"• User: {user.full_name} (Phone: {user.phone_number}, ID: {user.national_id})\n"
            f"• Course: {course.sport.name} at {course.academy.name}\n"
            f"• Instructor: {course.instructor_name or 'Not specified'}\n"
            f"• Price: {self.amount:,} Rials ({self.amount_in_toman:,} Tomans)\n"
            f"• Enrollment Date: {self.enrollment.enrolled_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"• Paid at: {paid_message}\n"
            f"• Status: {self.status}\n"
        )
        return description
    
    def save(self, *args, **kwargs):
        # For pending payments (existing or new), update amount from course
        if self.status == PaymentStatus.PENDING:
            if self.enrollment and self.enrollment.course:
                self.amount = self.enrollment.course.price
        
        # For new payments
        if not self.pk:
            if not self.enrollment:
                raise APIError(PaymentError.ENROLLMENT_REQUIRED)
        
        # Always regenerate description
        if self.enrollment and self.enrollment.course:
            self.description = self._generate_description()
        
        super().save(*args, **kwargs)
    
    def mark_as_paid(self, ref_num, masked_pan=None):
        """Mark as paid - FREEZE the amount at current course price"""
        if self.status == PaymentStatus.PAID:
            raise APIError(PaymentError.PAYMENT_ALREADY_VERIFIED)
        
        # Final update from course before freezing
        if self.status == PaymentStatus.PENDING:
            if self.enrollment and self.enrollment.course:
                self.amount = self.enrollment.course.price
        
        self.status = PaymentStatus.PAID
        self.ref_num = ref_num
        self.masked_pan = masked_pan
        self.paid_at = timezone.now()
        self.description = self._generate_description()
        self.save(update_fields=['amount', 'status', 'ref_num', 'masked_pan', 'paid_at', 'description', 'updated_at'])
    
    def mark_as_failed(self):
        """Mark as failed - amount can still be updated later if needed"""
        if self.status == PaymentStatus.PAID:
            raise APIError(PaymentError.CANNOT_FAIL_PAID_PAYMENT)
        
        self.status = PaymentStatus.FAILED
        self.description = self._generate_description()
        self.save(update_fields=['status', 'description', 'updated_at'])
    
    def mark_as_cancelled(self):
        """Mark as cancelled - amount can still be updated later if needed"""
        if self.status != PaymentStatus.PENDING:
            raise APIError(PaymentError.CANNOT_CANCEL_NON_PENDING_PAYMENT)
        
        self.status = PaymentStatus.CANCELLED
        self.description = self._generate_description()
        self.save(update_fields=['status', 'description', 'updated_at'])