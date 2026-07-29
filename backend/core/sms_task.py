# core/sms_task.py
import json
import logging
import http.client
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task
def send_sms_verification_task(phone_number: str, otp_code: str):
    """Send OTP verification code via SMS.ir template"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": 283578,
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
            logger.info(f"SMS sent")
            return True
        
        logger.error(f"SMS failed: {res.status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        conn.close()


@shared_task
def send_pre_registration_sms_task(phone_number: str, full_name: str, sport_name: str, academy_name: str):
    """Send pre-registration SMS"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": 696626,
            "parameters": [
                {"name": "FULLNAME", "value": full_name[:40]},
                {"name": "SPORT_NAME", "value": sport_name[:40]},
                {"name": "ACADEMY_NAME", "value": academy_name[:40]}
            ]
        })
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.SMSIR_API_KEY
        }
        
        conn.request("POST", "/v1/send/verify", payload, headers)
        res = conn.getresponse()
        
        if res.status == 200:
            logger.info(f"Pre-registration SMS sent")
            return True
        
        logger.error(f"Pre-registration SMS failed: {res.status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        conn.close()


@shared_task
def send_payment_reminder_sms_task(phone_number: str, full_name: str, sport_name: str, academy_name: str):
    """Send payment reminder SMS"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": 595510,
            "parameters": [
                {"name": "FULLNAME", "value": full_name[:40]},
                {"name": "SPORT_NAME", "value": sport_name[:40]},
                {"name": "ACADEMY_NAME", "value": academy_name[:40]}
            ]
        })
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.SMSIR_API_KEY
        }
        
        conn.request("POST", "/v1/send/verify", payload, headers)
        res = conn.getresponse()
        
        if res.status == 200:
            logger.info(f"Payment reminder SMS sent")
            return True
        
        logger.error(f"Payment reminder SMS failed: {res.status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        conn.close()


@shared_task
def send_payment_success_sms_task(phone_number: str, full_name: str, sport_name: str, academy_name: str, tracking_code: str):
    """Send payment success SMS"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": 880981,
            "parameters": [
                {"name": "FULLNAME", "value": full_name[:40]},
                {"name": "SPORT_NAME", "value": sport_name[:40]},
                {"name": "ACADEMY_NAME", "value": academy_name[:40]},
                {"name": "TRACKING_CODE", "value": tracking_code[:40]}
            ]
        })
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.SMSIR_API_KEY
        }
        
        conn.request("POST", "/v1/send/verify", payload, headers)
        res = conn.getresponse()
        
        if res.status == 200:
            logger.info(f"Payment success SMS sent")
            return True
        
        logger.error(f"Payment success SMS failed: {res.status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        conn.close()


@shared_task
def send_football_registration_sms_task(phone_number: str, full_name: str, position: str, academy_name: str, tracking_code: str):
    """Send football registration SMS"""
    try:
        conn = http.client.HTTPSConnection("api.sms.ir")
        
        payload = json.dumps({
            "mobile": phone_number,
            "templateId": 228539,
            "parameters": [
                {"name": "FULLNAME", "value": full_name[:40]},
                {"name": "POSITION", "value": position[:40]},
                {"name": "ACADEMY_NAME", "value": academy_name[:40]},
                {"name": "TRACKING_CODE", "value": tracking_code[:40]}
            ]
        })
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.SMSIR_API_KEY
        }
        
        conn.request("POST", "/v1/send/verify", payload, headers)
        res = conn.getresponse()
        
        if res.status == 200:
            logger.info(f"Football registration SMS sent")
            return True
        
        logger.error(f"Football registration SMS failed: {res.status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        conn.close()


@shared_task
def check_sms_token_remain():
    """Check SMS token balance and notify admins if below threshold"""
    conn = None
    try:
        # Get current credit balance
        conn = http.client.HTTPSConnection("api.sms.ir")
        headers = {'Content-Type': 'application/json', 'x-api-key': settings.SMSIR_API_KEY}
        conn.request("GET", "/v1/credit/", headers=headers)
        res = conn.getresponse()
        
        if res.status != 200:
            return False
        
        token_balance = int(json.loads(res.read().decode('utf-8')).get('data', 0))
        
        # Check if below threshold (500 tokens)
        if token_balance > 500:
            return True
        
        # Send notification to admins
        admins = ["09133820398", "09024629079"]
        notification_conn = http.client.HTTPSConnection("api.sms.ir")
        headers['x-api-key'] = settings.SMSIR_API_KEY
        
        for mobile in admins:
            payload = json.dumps({
                "mobile": mobile,
                "templateId": 793982,
                "parameters": [{"name": "TOKEN", "value": token_balance}]
            })
            notification_conn.request("POST", "/v1/send/verify", payload, headers)
            res = notification_conn.getresponse()
            
            if res.status == 200:
                logger.info(f"Notification sent for SMS.ir Recharge")
            else:
                logger.error(f"Failed to send Notification sent for SMS.ir Recharge")
        
        notification_conn.close()
        return True
        
    except Exception as e:
        logger.error(f"Error while checking SMS token: {e}")
        return False
    finally:
        if conn:
            conn.close()