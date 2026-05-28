from rest_framework.exceptions import APIException


class APIError(APIException):
    status_code = 400
    
    def __init__(self, error: tuple, data=None):
        self.detail = {
            "code": error[0],
            "message": error[1],
        }
        if data is not None:
            self.detail["error_data"] = data


# ============================================================================
# AUTHENTICATION APP
# ============================================================================
class AuthSessionError(APIError):
    SESSION_EXPIRE = (1, "Session expired. Please log in again")
    COOKIES_NOT_PROVIDE = (2, "No cookies found in request")
    INVALID_REFRESH_TOKEN = (3, "Invalid or expired refresh token")
    INVALID_ACCESS_TOKEN = (4, "Expired access token")
    NO_REFRESH_TOKEN = (5, "No refresh token provided in request cookie")

class AuthLoginError(APIError):
    INVALID_LOGIN_CREDENTIAL = (20, "Invalid credential for login")


class AuthPasswordError(APIError):
    TWO_PASSWORD_NOT_MATCH = (40, "New password and the repeat do not match")
    OLD_PASSWORD_INCORRECT = (41, "Old password is incorrect")
    PASSWORD_IS_WEAK = (42, "New password is not strong")
    PASSWORD_IS_REQUIRED = (43, "Password is required for this role")


class AuthOTPError(APIError):
    OTP_NOT_FOUND = (60, "OTP code not found or expired")
    OTP_NOT_CORRECT = (61, "OTP code not correct")
    OTP_PHONE_REQUIRED = (62, "phone number is require")
    OTP_RATE_LIMIT_EXCEEDED = (63, "You request for otp code to many times")
    OTP_MAX_ATTEMPTS = (64, "You enter wrong otp code to many time")
    OTP_ACCOUNT_BLOCKED = (65, "Your account is temporarily blocked. Please try again later.")


# ============================================================================
# USERS APP
# ============================================================================
class UserAccountError(APIError):
    USER_NOT_EXIST = (100, "User does not exist, or inactive")
    FORBIDDEN_ACTION = (101, "You are not allowed for this action")
    PHONE_NUMBER_REQUIRED = (102, "Phone number is required")
    SIGN_UP_NOT_ALLOWED = (103, "You are not allowed for sign up")


class UserDuplicateError(APIError):
    PHONE_NUMBER_REUSE = (120, "This phone number already exists")
    NATIONAL_ID_REUSE = (121, "This National ID already exists")
    EMPLOYE_NUMBER_REUSE = (122, "This Employee Number already exists")


class UserRoleError(APIError):
    MANAGER_NOT_ALLOW = (140, "A manager cannot create, see, or edit other manager or super")
    NOT_ALLOW_CHANGE_ROLE = (141, "No user can change its own role")
    USER_CREATE_NOT_ALLOW = (142, "You cannot make or edit a user with same or higher role than yourself")
    INVALID_ROLE = (143, "Not a valid Role")
    NOT_ALLOW_CHANGE_ACTIVE_STATUS = (144, "You cannot change you account active status")


class UserValidationError(APIError):
    INVALID_PHONE_NUMBER = (160, "Phone number must start with 09 and be 11 digits")
    INVALID_NATIONAL_ID = (161, "National ID must be 10 digits")


# ============================================================================
# Sport APP
# ============================================================================
class SportError(APIError):
    SPORT_NOT_EXIST = (201, "Sport does not exist")


# ============================================================================
# Academy APP
# ============================================================================
class AcademyError(APIError):
    ACADEMY_NOT_EXIST = (301, "Academy does not exist")

# ============================================================================
# classes APP
# ============================================================================
class ClassError(APIError):
    CLASS_NOT_EXIST = (401, "Course does not exist")
    COURSE_NAME_REQUIRED = (402, "Course name is required")
    COURSE_NAME_TOO_SHORT = (403, "Course name must be at least 3 characters")
    INVALID_MAX_STUDENTS = (404, "Maximum students must be greater than 0")
    INVALID_PRICE = (405, "Price cannot be negative")
    INVALID_DATE_RANGE = (406, "Start date cannot be after end date")
    INVALID_TIME_RANGE = (407, "Start time must be before end time")
    COURSE_CREATION_FAILED = (408, "Failed to create course")
    COURSE_UPDATE_FAILED = (409, "Failed to update course")
    COURSE_HAS_ENROLLMENTS = (410, "Cannot delete course with existing enrollments")
    SCHEDULE_NOT_FOUND = (411, "Schedule not found")

# ============================================================================
# REGISTRATIONS APP
# ============================================================================
class RegistrationError(APIError):
    ENROLLMENT_NOT_FOUND = (501, "Enrollment not found")
    ENROLLMENT_ACCESS_DENIED = (502, "You don't have permission to access this enrollment")
    ENROLLMENT_ALREADY_CANCELLED = (503, "Enrollment is already cancelled")
    ENROLLMENT_COMPLETED = (504, "Cannot cancel completed enrollment")
    COURSE_REQUIRED = (505, "Course ID is required")
    COURSE_FULL = (506, "This course is full")
    COURSE_NOT_ACTIVE = (507, "This course is not active for enrollment")
    GENDER_MISMATCH = (508, "This course is not available for your gender")
    ALREADY_ENROLLED = (509, "You are already enrolled in this course")
    TIME_CONFLICT = (510, "This course conflicts with your existing schedule")

# ============================================================================
# PAYMENT app
# ============================================================================
class PaymentError(APIError):
    PAYMENT_NOT_FOUND = (601, "Payment not found")
    PAYMENT_ALREADY_PROCESSED = (602, "Payment already processed")
    PAYMENT_FAILED = (603, "Payment failed")
    INVALID_AMOUNT = (604, "Invalid payment amount")
    GATEWAY_ERROR = (605, "Payment gateway error")
    PAYMENT_ALREADY_VERIFIED = (610, "Payment has already been verified")
    CANNOT_FAIL_PAID_PAYMENT = (611, "Cannot fail a payment that is already paid")
    CANNOT_CANCEL_NON_PENDING_PAYMENT = (612, "Only pending payments can be cancelled")
    ENROLLMENT_REQUIRED = (620, "Enrollment is required for payment")