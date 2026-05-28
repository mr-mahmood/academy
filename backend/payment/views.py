# apps/payments/views.py
import logging
from datetime import datetime
import random
import string
from django.shortcuts import redirect
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Payment, PaymentStatus
from .services import ZibalPaymentService
from courses.models import Course
from registrations.models import Enrollment
from core.exceptions import APIError, PaymentError, RegistrationError

logger = logging.getLogger(__name__)


class InitiatePaymentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        course_id = request.data.get('course_id')
        enrollment_id = request.data.get('enrollment_id')
        
        if not course_id:
            raise APIError(PaymentError.GATEWAY_ERROR, data="course_id is required")
        
        # 1. Find enrollment
        enrollment = None
        
        if enrollment_id:
            try:
                enrollment = Enrollment.objects.select_for_update().get(
                    id=enrollment_id,
                    user=user
                )
            except Enrollment.DoesNotExist:
                pass
        
        if not enrollment:
            enrollment = Enrollment.objects.filter(
                user=user,
                course_id=course_id
            ).select_for_update().first()
        
        if not enrollment:
            raise APIError(RegistrationError.ENROLLMENT_NOT_FOUND)
        
        # 2. Validate enrollment state
        if enrollment.enrollment_status == Enrollment.EnrollmentStatus.CONFIRMED:
            raise APIError(RegistrationError.ALREADY_ENROLLED)
        
        # Reactivate cancelled enrollments
        if enrollment.enrollment_status == Enrollment.EnrollmentStatus.CANCELLED:
            enrollment.enrollment_status = Enrollment.EnrollmentStatus.WAITING_FOR_PAYMENT
            enrollment.save(update_fields=['enrollment_status'])
        
        # 3. Handle existing payment
        payment = Payment.objects.filter(enrollment=enrollment).first()
        current_price = enrollment.course.price
        
        if payment:
            # Check if price has changed and payment has a track_id
            price_changed = payment.amount != current_price
            has_old_track_id = payment.track_id is not None
            
            # If price changed and we have an old track_id, we need to create a new payment
            if price_changed and has_old_track_id and payment.status == PaymentStatus.PENDING:
                # Clear the old track_id so a new one will be created
                payment.track_id = None
                payment.amount = current_price
                payment.save(update_fields=['track_id', 'amount', 'description', 'updated_at'])
                logger.info(f"Price changed for payment {payment.id} from {payment.amount} to {current_price}. Old track_id cleared.")
            
            # Update amount for pending payments
            if payment.status == PaymentStatus.PENDING:
                payment._update_pending_amount_from_course()
                payment.save(update_fields=['amount', 'description', 'updated_at'])
            
            # Check if existing payment has a valid track_id that's still pending
            if payment.track_id and payment.status == PaymentStatus.PENDING:
                return Response({
                    'success': True,
                    'message': 'Payment already initiated',
                    'track_id': payment.track_id,
                    'payment_id': payment.id,
                    'enrollment_id': enrollment.id,
                    'res_num': payment.res_num,
                    'amount': payment.amount,
                    'gateway_url': f"{ZibalPaymentService.START_PAGE}{payment.track_id}"
                }, status=status.HTTP_200_OK)
            
            # Reset payment (amount will be updated in save)
            payment.status = PaymentStatus.PENDING
            payment.track_id = None
            payment.ref_num = None
            payment.save()
            logger.info(f"Resetting payment {payment.id} for enrollment {enrollment.id}")
        else:
            # Create new payment - amount will be set in save() from course
            payment = Payment.objects.create(
                enrollment=enrollment,
                status=PaymentStatus.PENDING
            )
            logger.info(f"Created new payment {payment.id} for enrollment {enrollment.id}")
        
        # 4. Generate unique order number (res_num) if needed
        if not payment.res_num:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            random_digits = ''.join(random.choices(string.digits, k=6))
            payment.res_num = f"{timestamp}{random_digits}"
            payment.save(update_fields=['res_num'])
        
        # 5. Build dynamic callback URL
        callback_url = request.build_absolute_uri('/api/payment/callback/')
        
        # 6. Request NEW trackId from Zibal with current price
        service = ZibalPaymentService()
        result = service.request_payment(
            payment=payment,
            callback_url=callback_url,
            mobile=user.phone_number if hasattr(user, 'phone_number') else None,
        )
        
        if result['success']:
            return Response({
                'success': True,
                'message': 'Payment initiated',
                'track_id': result['track_id'],
                'payment_id': payment.id,
                'enrollment_id': enrollment.id,
                'res_num': payment.res_num,
                'amount': payment.amount,
                'gateway_url': f"{ZibalPaymentService.START_PAGE}{result['track_id']}"
            }, status=status.HTTP_200_OK)
        else:
            payment.mark_as_failed()
            logger.error(f"Payment initiation failed: {result}")
            raise APIError(PaymentError.GATEWAY_ERROR, data=result.get('error', 'Payment initiation failed'))
        
        
@method_decorator(csrf_exempt, name='dispatch')
class PaymentCallbackAPIView(APIView):
    permission_classes = []
    authentication_classes = []
    
    @transaction.atomic
    def get(self, request):
        track_id = request.GET.get('trackId')
        success_flag = request.GET.get('success')
        order_id = request.GET.get('orderId')
        gateway_status = request.GET.get('status')
        
        logger.info(f"Callback received: trackId={track_id}, success={success_flag}, orderId={order_id}, status={gateway_status}")
        
        if not track_id or not order_id:
            return redirect('/payment/result?status=failed&error=missing_parameters')
        
        # Find payment
        try:
            payment = Payment.objects.select_for_update().get(res_num=order_id)
        except Payment.DoesNotExist:
            return redirect(f"/payment/result?status=failed&error=order_not_found")
        
        # Update track_id if needed
        if not payment.track_id:
            payment.track_id = track_id
            payment.save(update_fields=['track_id'])
        
        # Prevent double processing
        if payment.status == PaymentStatus.PAID:
            return redirect(f"/payment/result?status=success&ref_num={payment.ref_num}&res_num={order_id}")
        
        if payment.status == PaymentStatus.REVERSED:
            return redirect(f"/payment/result?status=failed&res_num={order_id}&error=already_reversed")
        
        # Check success flag
        if success_flag != '1':
            if gateway_status == '3':
                payment.mark_as_cancelled()
            else:
                payment.mark_as_failed()
            return redirect(f"/payment/result?status=failed&res_num={order_id}&error=payment_unsuccessful")
        
        # IMPORTANT: Update amount one more time before verification
        # This ensures the user pays the absolute latest price
        if payment.status == PaymentStatus.PENDING:
            payment._update_pending_amount_from_course()
            payment.save(update_fields=['amount', 'description', 'updated_at'])
        
        # Verify payment
        service = ZibalPaymentService()
        verify_result = service.verify_payment(payment)
        
        if verify_result.get('verified'):
            # Amount validation - payment.amount is the current course price
            if verify_result.get('amount') != payment.amount:
                payment.mark_as_failed()
                logger.error(f"Amount mismatch: expected {payment.amount}, got {verify_result.get('amount')}")
                return redirect(f"/payment/result?status=failed&res_num={order_id}&error=amount_mismatch")
            
            # Mark as paid - this FREEZES the amount
            payment.mark_as_paid(
                ref_num=str(verify_result.get('ref_number')),
                masked_pan=verify_result.get('masked_card')
            )
            
            # Confirm enrollment
            enrollment = payment.enrollment
            if enrollment:
                enrollment.enrollment_status = Enrollment.EnrollmentStatus.CONFIRMED
                enrollment.save(update_fields=['enrollment_status'])
            
            logger.info(f"Payment {payment.id} verified successfully. Amount frozen at {payment.amount}")
            return redirect(f"/payment/result?status=success&ref_num={payment.ref_num}&res_num={order_id}")
        else:
            payment.mark_as_failed()
            error_msg = verify_result.get('message', 'verification_failed')
            logger.error(f"Verification failed for payment {payment.id}: {error_msg}")
            return redirect(f"/payment/result?status=failed&res_num={order_id}&error={error_msg}")


class PaymentStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, res_num):
        try:
            payment = Payment.objects.get(res_num=res_num, enrollment__user=request.user)
        except Payment.DoesNotExist:
            raise APIError(PaymentError.PAYMENT_NOT_FOUND)
        
        # Update amount if pending (so user sees current price)
        if payment.status == PaymentStatus.PENDING:
            payment._update_pending_amount_from_course()
        
        return Response({
            'success': True,
            'status': payment.status,
            'amount': payment.amount,
            'ref_num': payment.ref_num,
            'track_id': payment.track_id,
            'masked_pan': payment.masked_pan,
            'created_at': payment.created_at,
            'paid_at': payment.paid_at,
            'enrollment_id': payment.enrollment.id if payment.enrollment else None,
            'course_id': payment.course.id if payment.course else None
        })