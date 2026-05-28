import re
from core.exceptions import APIError, UserValidationError, UserDuplicateError
from django.core.exceptions import ValidationError
from users.models import User

# instance=None → create
# instance=<User> → update ( so we exclude the user it self from qs)

def raise_error(error_class, error_type, admin_panel):
    if admin_panel:
        raise ValidationError(error_type[1])
    else:
        raise error_class(error_type) # custome errors for core.exceptions


def validate_phone_number(value, instance=None, admin_panel=False):
    if not value:
        return value
    
    qs = User.objects.filter(phone_number=value)
    
    if instance is not None:
        qs = qs.exclude(pk=instance.pk)
        
    if qs.exists():
        raise_error(APIError, UserDuplicateError.PHONE_NUMBER_REUSE, admin_panel)
        
    if not re.fullmatch(r"09\d{9}", value):
        raise_error(APIError, UserValidationError.INVALID_PHONE_NUMBER, admin_panel)
        
    return value


def validate_iranian_national_id(national_id):
    """
    Example: 1234567890 (10 digits)
    Digit positions: 1 2 3 4 5 6 7 8 9 0
                     ↑                 ↑
                   position 1      position 10 (checksum)
    """
    
    # Step 1: Get the last digit (checksum)
    check_digit = int(national_id[-1])  # In example: 0
    
    # Step 2: Calculate weighted sum of first 9 digits
    # Each digit is multiplied by (10 - position)
    # Position 1 × 10, Position 2 × 9, ..., Position 9 × 2
    sum = 0
    for i in range(9):  # i = 0 to 8
        sum += int(national_id[i]) * (10 - i)
    
    # Step 3: Calculate remainder
    remainder = sum % 11
    
    # Step 4: Validate checksum
    if remainder < 2:
        return check_digit == remainder
    else:
        return check_digit == (11 - remainder)

def validate_national_id(value, instance=None, admin_panel=False):
    """
    Validate Iranian National ID (Melli code)
    - Must be 10 digits
    - Must be unique in database
    - Must pass mathematical checksum validation
    """
    if not value:
        return value
    
    # Convert to string and strip any whitespace
    value = str(value).strip()
    
    # Check uniqueness in database
    qs = User.objects.filter(national_id=value)
    
    if instance is not None:
        qs = qs.exclude(pk=instance.pk)
        
    if qs.exists():
        raise_error(APIError, UserDuplicateError.NATIONAL_ID_REUSE, admin_panel)
    
    # Check format: must be exactly 10 digits
    if not re.fullmatch(r"\d{10}", value):
        raise_error(APIError, UserValidationError.INVALID_NATIONAL_ID, admin_panel)
    
    # Check mathematical validity using Iranian National ID algorithm
    if not validate_iranian_national_id(value):
        raise_error(APIError, UserValidationError.INVALID_NATIONAL_ID, admin_panel)
    
    return value