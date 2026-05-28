# authentication/views.py
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from users.models import User
from users.serializers import UserProfileSerializer
from core.exceptions import APIError, AuthOTPError, AuthSessionError
from authentication.cookies import make_cookie
from authentication.tokens import VersionedRefreshToken, rotate_refresh_token
from authentication.auth import RefreshJWTAuthentication
from authentication.otp_service import generate_otp, verify_otp


PHONE_VERIFIED_PREFIX = settings.PHONE_VERIFIED_PREFIX
PHONE_VERIFIED_EXPIRY = settings.PHONE_VERIFIED_EXPIRY


class RequestOTPApiView(APIView):
    """
    Step 1: Request OTP for phone number
    - If user exists: OTP for login
    - If user doesn't exist: OTP for signup
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone_number = request.data.get("phone")
        
        if not phone_number:
            raise APIError(AuthOTPError.OTP_PHONE_REQUIRED)
        
        # Generate and send OTP
        result, user_exists = generate_otp(phone_number)
        
        if result:
            return Response({
                "message": "OTP sent successfully",
                "new_user": not user_exists
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "Failed to send OTP. Please try again."
            }, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPApiView(APIView):
    """
    Step 2: Verify OTP and handle login/signup flow
    - If user exists: Log them in immediately
    - If user doesn't exist: Mark phone as verified for signup
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone_number = request.data.get("phone")
        otp_code = request.data.get("otp")
        
        if not phone_number or not otp_code:
            raise APIError(AuthOTPError.OTP_PHONE_REQUIRED)
        
        # Verify OTP (returns True or raises exception)
        verify_otp(phone_number, otp_code)
        
        # Check if user exists
        user_exists = User.objects.filter(phone_number=phone_number).exists()
        
        if user_exists:
            # Existing user - login immediately
            return self._login_existing_user(request, phone_number)
        else:
            # New user - mark phone as verified for signup
            return self._mark_phone_for_signup(phone_number)
    
    def _login_existing_user(self, request, phone_number):
        """Login existing user and set authentication cookies"""
        user = User.get_user_by_phone(phone_number)
        user.token_version += 1  # invalidate old JWTs
        user.save(update_fields=["token_version"])
        
        # Generate tokens
        refresh = VersionedRefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        response = Response({
            "message": "Logged in successfully",
            "user": UserProfileSerializer(user, context={"request": request}).data
        }, status=status.HTTP_200_OK)
        
        make_cookie(response, {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_version": user.token_version,
        })
        
        return response
    
    def _mark_phone_for_signup(self, phone_number):
        """Mark phone as verified for new user signup"""
        verified_key = f"{PHONE_VERIFIED_PREFIX}_{phone_number}"
        cache.set(
            verified_key, 
            {"phone_number": phone_number}, 
            timeout=PHONE_VERIFIED_EXPIRY
        )
        
        responce = Response({
            "message": "Phone verified successfully. Please complete your registration.",
            "phone_verified": True,
            "phone_number": phone_number
        }, status=status.HTTP_200_OK)
        
        return responce


class LogoutAPIView(APIView):
    """Logout user and blacklist refresh token"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        
        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()
            except TokenError:
                pass  # Token already invalid or expired
        
        # Clear cookies
        response = Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        response.delete_cookie("token_version")
        
        return response


class RefreshAPIView(APIView):
    """Refresh access token using refresh token from cookie"""
    authentication_classes = [RefreshJWTAuthentication]
    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        
        if not refresh_token:
            raise APIError(AuthSessionError.NO_REFRESH_TOKEN)
        
        try:
            new_access, new_refresh = rotate_refresh_token(refresh_token, request)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        response = Response({"message": "Token refreshed successfully"}, status=status.HTTP_200_OK)
        make_cookie(response, {
            "access_token": new_access,
            "refresh_token": new_refresh,
        })
        
        return response