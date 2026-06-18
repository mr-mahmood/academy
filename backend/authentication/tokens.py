# authentication/tokens.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from core.exceptions import APIError, AuthSessionError
from users.models import User


class VersionedRefreshToken(RefreshToken):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        return token


def rotate_refresh_token(refresh_token_str, request):
    try:
        old_refresh = RefreshToken(refresh_token_str)
    except TokenError:
        raise APIError(AuthSessionError.INVALID_REFRESH_TOKEN)

    user = User.objects.get(id=old_refresh["uid"])

    # blacklist old refresh token
    old_refresh.blacklist()

    # new refresh & access
    new_refresh = VersionedRefreshToken.for_user(user)
    new_access = str(new_refresh.access_token)

    return new_access, str(new_refresh)