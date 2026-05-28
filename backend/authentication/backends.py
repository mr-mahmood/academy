from django.contrib.auth.backends import BaseBackend
from core.exceptions import APIError, UserAccountError
from users.models import User

class OTPAuthBackend(BaseBackend):
    def authenticate(self, request, user_id=None, **kwargs):
        if not user_id:
            return None
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

        if not user.is_active:
            raise APIError(UserAccountError.USER_NOT_EXIST)

        return user
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None