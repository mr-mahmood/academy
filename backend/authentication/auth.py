from rest_framework_simplejwt.authentication import JWTAuthentication
from core.exceptions import UserAccountError, AuthSessionError, APIError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from users.models import User
from rest_framework.authentication import BaseAuthentication


class VersionedJWTAuthentication(JWTAuthentication):
    """
    Access-token authentication with single-session enforcement.
    """

    def authenticate(self, request):
        token = request.COOKIES.get("access_token")
        token_version = request.COOKIES.get("token_version")

        if not token or not token_version:
            raise AuthSessionError(AuthSessionError.COOKIES_NOT_PROVIDE)

        validated_token = self.get_validated_token(token)

        try:
            user: User = self.get_user(validated_token)
        except Exception:
            raise APIError(UserAccountError.USER_NOT_EXIST)

        if str(user.token_version) != str(token_version):
            raise APIError(AuthSessionError.SESSION_EXPIRE)

        return (user, validated_token)

    
class RefreshJWTAuthentication(JWTAuthentication):
    """
    Authenticate using refresh token only.
    Used exclusively for token refresh endpoint.
    """

    def authenticate(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        token_version = request.COOKIES.get("token_version")

        if not refresh_token or not token_version:
            raise APIError(AuthSessionError.COOKIES_NOT_PROVIDE)

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            raise APIError(AuthSessionError.SESSION_EXPIRE)

        try:
            user: User = User.objects.get(id=refresh["uid"])
        except User.DoesNotExist:
            raise APIError(UserAccountError.USER_NOT_EXIST)

        if str(user.token_version) != str(token_version):
            raise APIError(AuthSessionError.SESSION_EXPIRE)

        access_token = refresh.access_token
        return (user, access_token)
    