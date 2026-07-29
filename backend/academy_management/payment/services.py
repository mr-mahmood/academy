import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class ZibalPaymentService:
    """
    Service class to handle all Zibal payment gateway API calls.
    """
    BASE_URL = "https://gateway.zibal.ir"
    REQUEST_URL = f"{BASE_URL}/v1/request"
    VERIFY_URL = f"{BASE_URL}/v1/verify"
    INQUIRY_URL = f"{BASE_URL}/v1/inquiry"
    START_PAGE = f"{BASE_URL}/start/"

    def __init__(self, merchant=None):
        self.merchant = merchant or getattr(settings, 'ZIBAL_MERCHANT', 'zibal')

    def request_payment(self, payment, callback_url, order_id=None, mobile=None, description=None):
        """
        Send order details to Zibal and receive a trackId.
        Returns: {'success': bool, 'track_id': int, 'error': str}
        """
        payload = {
            "merchant": self.merchant,
            "amount": int(payment.amount),
            "callbackUrl": callback_url,
            "orderId": order_id or payment.res_num,
            "description": description or f"Payment for order {payment.res_num}",
        }
        if mobile:
            payload["mobile"] = mobile

        try:
            response = requests.post(
                self.REQUEST_URL,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=300
            )
            result = response.json()

            if result.get('result') == 100:
                track_id = result.get('trackId')
                payment.track_id = track_id
                payment.save(update_fields=['updated_at', 'track_id'])
                return {'success': True, 'track_id': track_id, 'error': None}
            else:
                error_msg = result.get('message', 'Unknown error')
                logger.error(f"Zibal request failed: {error_msg}")
                return {'success': False, 'track_id': None, 'error': error_msg}

        except requests.exceptions.Timeout:
            logger.error("Zibal request timeout")
            return {'success': False, 'track_id': None, 'error': 'Gateway timeout'}
        except Exception as e:
            logger.exception(f"Zibal request error: {e}")
            return {'success': False, 'track_id': None, 'error': str(e)}

    def verify_payment(self, payment):
        """
        Verify the payment using its trackId.
        Returns dict with detailed verification result.
        """
        if not payment.track_id:
            return {
                'success': False,
                'verified': False,
                'amount': 0,
                'message': 'No trackId associated with this payment',
                'ref_number': None,
                'masked_card': None
            }

        payload = {
            "merchant": self.merchant,
            "trackId": payment.track_id
        }

        try:
            response = requests.post(
                self.VERIFY_URL,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=300
            )
            result = response.json()

            if result.get('result') == 100:
                verified_status = result.get('status')
                if verified_status == 1:
                    return {
                        'success': True,
                        'verified': True,
                        'amount': result.get('amount'),
                        'message': result.get('message'),
                        'ref_number': result.get('refNumber'),
                        'masked_card': result.get('cardNumber'),
                        'paid_at': result.get('paidAt'),
                    }
                else:
                    return {
                        'success': True,
                        'verified': False,
                        'amount': result.get('amount'),
                        'message': f"Payment status is {verified_status}",
                        'ref_number': result.get('refNumber'),
                        'masked_card': result.get('cardNumber'),
                    }
            else:
                return {
                    'success': False,
                    'verified': False,
                    'amount': 0,
                    'message': result.get('message', 'Verification failed'),
                    'ref_number': None,
                    'masked_card': None
                }

        except Exception as e:
            logger.exception(f"Zibal verify error: {e}")
            return {
                'success': False,
                'verified': False,
                'amount': 0,
                'message': str(e),
                'ref_number': None,
                'masked_card': None
            }