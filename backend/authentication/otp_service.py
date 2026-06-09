import secrets
import hashlib
import hmac
import time
from django.conf import settings
from django.core.cache import cache
from users.models import User
from users.validators import validate_phone_number
from core.sms_task import send_sms_verification_task
from core.exceptions import APIError, AuthOTPError

import logging
logger = logging.getLogger(__name__)

# Load constants from Django settings
OTP_CACHE_PREFIX = settings.OTP_CACHE_PREFIX
OTP_REQUEST_LIMIT_PREFIX = settings.OTP_REQUEST_LIMIT_PREFIX
OTP_BLOCKED_PREFIX = settings.OTP_BLOCKED_PREFIX
PHONE_VERIFIED_PREFIX = settings.PHONE_VERIFIED_PREFIX

OTP_EXPIRY_SECONDS = settings.OTP_EXPIRY_SECONDS
OTP_RATE_WINDOW = settings.OTP_RATE_WINDOW
PHONE_VERIFIED_EXPIRY = settings.PHONE_VERIFIED_EXPIRY
OTP_BLOCK_DURATION = settings.OTP_BLOCK_DURATION

OTP_MAX_REQUESTS = settings.OTP_MAX_REQUESTS
OTP_MAX_VERIFICATION_ATTEMPTS = settings.OTP_MAX_VERIFICATION_ATTEMPTS

OTP_HASH_SECRET = settings.SECRET_KEY


def generate_otp(phone_number: str):
    """Generate and send OTP to phone number with rate limiting"""
    
    if not phone_number:
        raise APIError(AuthOTPError.OTP_PHONE_REQUIRED)
    
    # === CHECK IF USER IS BLOCKED ===
    if _is_user_blocked(phone_number):
        remaining_time = get_block_remaining_time(phone_number)
        raise APIError(
            AuthOTPError.OTP_ACCOUNT_BLOCKED, 
            {"remaining_seconds": remaining_time}
        )
    
    # === REQUEST LIMIT (Prevents SMS bombing) ===
    request_key = f"{OTP_REQUEST_LIMIT_PREFIX}_{phone_number}"
    request_count = cache.get(request_key, 0)
    
    if request_count >= OTP_MAX_REQUESTS:
        _block_user(phone_number)
        remaining_time = get_block_remaining_time(phone_number)
        raise APIError(
            AuthOTPError.OTP_ACCOUNT_BLOCKED,
            {"remaining_seconds": remaining_time}
        )
    
    # Increment request counter
    cache.set(request_key, request_count + 1, timeout=OTP_RATE_WINDOW)
    
    # Check if user exists
    user_exists = User.objects.filter(phone_number=phone_number).exists()

    if not user_exists:
        validate_phone_number(phone_number)

    # Generate secure OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    # Hash the OTP before storing
    hashed_otp = _hash_otp(otp_code)

    # Store HASHED OTP with verification attempt counter
    cache_key = f"{OTP_CACHE_PREFIX}_{phone_number}"
    otp_data = {
        "hashed_code": hashed_otp,
        "verification_attempts": 0,
    }
    cache.set(cache_key, otp_data, OTP_EXPIRY_SECONDS)
    
    send_sms_verification_task.delay(phone_number, otp_code)
    del otp_code
    
    return True, user_exists
    

def verify_otp(phone_number: str, otp_code: str) -> bool:
    """Verify OTP code with attempt limiting"""
    
    if not phone_number or not otp_code:
        raise APIError(AuthOTPError.OTP_PHONE_REQUIRED)
    
    # === CHECK IF USER IS BLOCKED ===
    if _is_user_blocked(phone_number):
        remaining_time = get_block_remaining_time(phone_number)
        raise APIError(
            AuthOTPError.OTP_ACCOUNT_BLOCKED, 
            {"remaining_seconds": remaining_time}
        )
    
    # Get OTP from cache
    cache_key = f"{OTP_CACHE_PREFIX}_{phone_number}"
    stored_otp_data = cache.get(cache_key)
    
    if not stored_otp_data:
        raise APIError(AuthOTPError.OTP_NOT_FOUND)
    
    # === VERIFICATION ATTEMPT LIMIT ===
    current_attempts = stored_otp_data.get("verification_attempts", 0)
    
    if current_attempts >= OTP_MAX_VERIFICATION_ATTEMPTS:
        # Delete the OTP
        cache.delete(cache_key)
        # BLOCK THE USER
        _block_user(phone_number)
        remaining_time = get_block_remaining_time(phone_number)
        raise APIError(
            AuthOTPError.OTP_ACCOUNT_BLOCKED, 
            {"remaining_seconds": remaining_time}
        )
    
    # Hash the input OTP and compare with stored hash
    hashed_input = _hash_otp(otp_code)
    stored_hash = stored_otp_data.get("hashed_code")
    
    # Verify OTP using constant-time comparison (PREVENT Timing Attack)
    if hmac.compare_digest(hashed_input, stored_hash):
        # Success - delete OTP
        cache.delete(cache_key)
        cache.delete(f'{OTP_REQUEST_LIMIT_PREFIX}_{phone_number}')
        return True
    else:
        # Increment failed verification attempts
        stored_otp_data["verification_attempts"] = current_attempts + 1
        cache.set(cache_key, stored_otp_data, OTP_EXPIRY_SECONDS)
        
        # If this was the last attempt, block the user
        if current_attempts + 1 >= OTP_MAX_VERIFICATION_ATTEMPTS:
            _block_user(phone_number)
            remaining_time = get_block_remaining_time(phone_number)
            raise APIError(
                AuthOTPError.OTP_ACCOUNT_BLOCKED, 
                {"remaining_seconds": remaining_time}
            )
        
        raise APIError(
            AuthOTPError.OTP_NOT_CORRECT,
            {"remaining_attempts": get_remaining_verification_attempts(phone_number)}    
        )
    
    
def _hash_otp(otp_code: str) -> str:
    """Hash OTP code using HMAC-SHA256"""
    return hmac.new(
        key=OTP_HASH_SECRET.encode('utf-8'),
        msg=otp_code.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()


def _is_user_blocked(phone_number: str) -> bool:
    """Check if user is temporarily blocked"""
    block_key = f"{OTP_BLOCKED_PREFIX}_{phone_number}"
    return cache.get(block_key) is not None


def _block_user(phone_number: str):
    """Block user from requesting or verifying OTPs"""
    block_key = f"{OTP_BLOCKED_PREFIX}_{phone_number}"
    data = {
        "phone": phone_number,
        "expires_at": time.time() + OTP_BLOCK_DURATION
    }
    cache.set(block_key, data, timeout=OTP_BLOCK_DURATION)
    
    
def get_block_remaining_time(phone_number: str) -> int:
    """Get remaining block time in seconds"""
    block_key = f"{OTP_BLOCKED_PREFIX}_{phone_number}"
    block_data = cache.get(block_key)
    
    if not block_data:
        return 0
    
    expiration_time = block_data.get("expires_at", 0)
    remaining = expiration_time - time.time()
    
    return max(0, int(remaining))


def get_remaining_verification_attempts(phone_number: str) -> int:
    """Check how many verification attempts remain for current OTP"""
    if _is_user_blocked(phone_number):
        return 0
    
    cache_key = f"{OTP_CACHE_PREFIX}_{phone_number}"
    stored = cache.get(cache_key)
    
    if not stored:
        return 0
    
    attempts = stored.get("verification_attempts", 0)
    return max(0, OTP_MAX_VERIFICATION_ATTEMPTS - attempts)