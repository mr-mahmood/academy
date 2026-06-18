import logging
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from core.exceptions import UserAccountError, AuthSessionError, APIError
from users.models import User

logger = logging.getLogger(__name__)

class VersionedJWTAuthentication(JWTAuthentication):
    """
    Access-token authentication
    """

    def authenticate(self, request):
        token = request.COOKIES.get("access_token")

        if not token:
            logger.warning("No access token found in cookies")
            raise APIError(AuthSessionError.COOKIES_NOT_PROVIDE)

        try:
            validated_token = self.get_validated_token(token)
        except Exception as e:
            raise APIError(AuthSessionError.INVALID_ACCESS_TOKEN)

        try:
            user: User = self.get_user(validated_token)
        except User.DoesNotExist:
            logger.warning(f"User not found for token")
            raise APIError(UserAccountError.USER_NOT_EXIST)
        except Exception as e:
            logger.error(f"Error getting user from token: {str(e)}")
            raise APIError(UserAccountError.USER_NOT_EXIST)

        return (user, validated_token)
    
    
class RefreshJWTAuthentication(JWTAuthentication):
    """
    Authenticate using refresh token only.
    Used exclusively for token refresh endpoint.
    """

    def authenticate(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            raise APIError(AuthSessionError.COOKIES_NOT_PROVIDE)

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            raise APIError(AuthSessionError.SESSION_EXPIRE)

        try:
            user: User = User.objects.get(id=refresh["uid"])
        except User.DoesNotExist:
            raise APIError(UserAccountError.USER_NOT_EXIST)

        access_token = refresh.access_token
        return (user, access_token)
    