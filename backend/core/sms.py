import json
import logging
import http.client
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms_verification(phone_number: str, otp_code: str) -> bool:
    """Send OTP verification code via SMS.ir template"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": int(settings.SMSIR_TEMPLATE_ID),
            "parameters": [
                {
                    "name": "OTP",
                    "value": otp_code
                }
            ]
        })
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.SMSIR_API_KEY
        }
        
        conn.request("POST", "/v1/send/verify", payload, headers)
        res = conn.getresponse()
        
        if res.status == 200:
            logger.info(f"SMS sent to {phone_number}")
            return True
        
        logger.error(f"SMS failed: {res.status}")
        return False
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return False
    finally:
        conn.close()