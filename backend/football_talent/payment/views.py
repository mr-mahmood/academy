# football_talent/payment/views.py

import logging
from django.utils import timezone
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

from users.models import User

from .models import FootballPayment, FootballPaymentStatus
from .services import ZibalFootballPaymentService
from football_talent.enrollment.models import FootballEnrollment
from core.exceptions import APIError, PaymentError, RegistrationError
from core.sms_task import send_football_registration_sms_task

logger = logging.getLogger(__name__)


class InitiateFootballPaymentAPIView(APIView):
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
                enrollment = FootballEnrollment.objects.select_for_update().get(
                    id=enrollment_id,
                    user=user
                )
            except FootballEnrollment.DoesNotExist:
                pass
        
        if not enrollment:
            enrollment = FootballEnrollment.objects.filter(
                user=user,
                course_id=course_id
            ).select_for_update().first()
        
        if not enrollment:
            raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
        
        # 2. Validate enrollment state
        if enrollment.enrollment_status == FootballEnrollment.EnrollmentStatus.CONFIRMED:
            raise APIError(RegistrationError.ALREADY_ENROLLED)
        
        # Reactivate cancelled enrollments
        if enrollment.enrollment_status == FootballEnrollment.EnrollmentStatus.CANCELLED:
            enrollment.enrollment_status = FootballEnrollment.EnrollmentStatus.WAITING_FOR_PAYMENT
            enrollment.save(update_fields=['enrollment_status'])
        
        # 3. Get or create payment (but always reset it for new attempt)
        payment, created = FootballPayment.objects.get_or_create(
            enrollment=enrollment,
        )
        
        if not created:
            # Reset existing payment with fresh values
            payment.status = FootballPaymentStatus.PENDING
            payment.track_id = None
            payment.ref_num = None
            payment.masked_pan = None
            payment.paid_at = None
            payment.amount = enrollment.course.price
            payment.description = ''
            payment.save()
            logger.info(f"Reset existing payment {payment.id} for enrollment {enrollment.id}")
        
        # Generate unique order number (res_num) if not exists
        if not payment.res_num:
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_digits = ''.join(random.choices(string.digits, k=6))
            payment.res_num = f"F{timestamp}{random_digits}"
            payment.save(update_fields=['res_num'])
        
        # Build dynamic callback URL
        callback_url = request.build_absolute_uri('/api/football/payment/callback/')
        
        # Request NEW trackId from Zibal with current price
        service = ZibalFootballPaymentService()
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
                'gateway_url': f"{ZibalFootballPaymentService.START_PAGE}{result['track_id']}"
            }, status=status.HTTP_200_OK)
        else:
            payment.mark_as_failed()
            logger.error(f"Football payment initiation failed: {result}")
            raise APIError(PaymentError.GATEWAY_ERROR, data=result.get('error', 'Payment initiation failed'))
        

@method_decorator(csrf_exempt, name='dispatch')
class FootballPaymentCallbackAPIView(APIView):
    permission_classes = []
    authentication_classes = []
    
    @transaction.atomic
    def get(self, request):
        track_id = request.GET.get('trackId')
        success_flag = request.GET.get('success')
        order_id = request.GET.get('orderId')
        gateway_status = request.GET.get('status')
        
        logger.info(f"Football callback received: trackId={track_id}, success={success_flag}, orderId={order_id}, status={gateway_status}")
        
        if not track_id or not order_id:
            return redirect('/football/payment/result?status=failed&error=missing_parameters')
        
        # Find payment
        try:
            payment = FootballPayment.objects.select_for_update().get(res_num=order_id)
        except FootballPayment.DoesNotExist:
            return redirect(f"/football/payment/result?status=failed&error=order_not_found")
        
        # Update track_id if needed
        if not payment.track_id:
            payment.track_id = track_id
            payment.save(update_fields=['track_id'])
        
        # Prevent double processing
        if payment.status == FootballPaymentStatus.PAID:
            return redirect(f"/football/payment/result?status=success&ref_num={payment.ref_num}&res_num={order_id}")
        
        if payment.status == FootballPaymentStatus.REVERSED:
            return redirect(f"/football/payment/result?status=failed&res_num={order_id}&error=already_reversed")
        
        # Check success flag
        if success_flag != '1':
            if gateway_status == '3':
                payment.mark_as_cancelled()
            else:
                payment.mark_as_failed()
            return redirect(f"/football/payment/result?status=failed&res_num={order_id}&error=payment_unsuccessful")
        
        # IMPORTANT: Update amount one more time before verification
        # This ensures the user pays the absolute latest price
        if payment.status == FootballPaymentStatus.PENDING:
            payment._update_pending_amount_from_course()
            payment.save(update_fields=['amount', 'description', 'updated_at'])
        
        # Verify payment
        service = ZibalFootballPaymentService()
        verify_result = service.verify_payment(payment)
        
        if verify_result.get('verified'):
            # Amount validation - payment.amount is the current course price
            if verify_result.get('amount') != payment.amount:
                payment.mark_as_failed()
                logger.error(f"Amount mismatch: expected {payment.amount}, got {verify_result.get('amount')}")
                return redirect(f"/football/payment/result?status=failed&res_num={order_id}&error=amount_mismatch")
            
            # Mark as paid - this FREEZES the amount
            payment.mark_as_paid(
                ref_num=str(verify_result.get('ref_number')),
                masked_pan=verify_result.get('masked_card')
            )
            
            # Confirm enrollment
            enrollment = payment.enrollment
            if enrollment:
                enrollment.enrollment_status = FootballEnrollment.EnrollmentStatus.CONFIRMED
                enrollment.save(update_fields=['enrollment_status'])
                
                # === ADD THIS: Send football registration SMS asynchronously ===
                try:
                    # Get user and course details for SMS
                    user: User = enrollment.user
                    course = enrollment.course
                    
                    full_name = f"{user.full_clean()}".strip()
                    position = course.position
                    academy_name = course.academy.name
                    tracking_code = str(verify_result.get('ref_number', payment.ref_num or 'N/A'))
                    
                    # Queue SMS task - this returns immediately, doesn't block
                    send_football_registration_sms_task.delay(
                        phone_number=user.phone_number,
                        full_name=full_name,
                        position=position,
                        academy_name=academy_name,
                        tracking_code=tracking_code
                    )
                    logger.info(f"Football registration SMS queued for user {user.phone_number}")
                    
                except Exception as e:
                    pass
                # === END OF SMS TASK ===
            
            logger.info(f"Football payment {payment.id} verified successfully. Amount frozen at {payment.amount}")
            return redirect(f"/football/payment/result?status=success&ref_num={payment.ref_num}&res_num={order_id}")
        else:
            payment.mark_as_failed()
            error_msg = verify_result.get('message', 'verification_failed')
            logger.error(f"Verification failed for football payment {payment.id}: {error_msg}")
            return redirect(f"/football/payment/result?status=failed&res_num={order_id}&error={error_msg}")


class FootballPaymentStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, res_num):
        try:
            payment = FootballPayment.objects.get(res_num=res_num, enrollment__user=request.user)
        except FootballPayment.DoesNotExist:
            raise APIError(PaymentError.PAYMENT_NOT_FOUND)
        
        # Update amount if pending (so user sees current price)
        if payment.status == FootballPaymentStatus.PENDING:
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