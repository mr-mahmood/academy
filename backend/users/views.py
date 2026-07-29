from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.cache import cache
from users.serializers import UserProfileSerializer
from users.models import User
from typing import cast
from authentication.cookies import make_cookie
from core.exceptions import APIError, UserAccountError
from authentication.permissions import IsAdmin
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.settings import api_settings

PHONE_VERIFIED_PREFIX = "phone_verified"



class UserSignupAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication
    serializer_class = UserProfileSerializer
    
    def post(self, request):
        phone_number = request.data.get("phone_number")
        
        if not phone_number:
            raise APIError(UserAccountError.PHONE_NUMBER_REQUIRED)
        
        # Check if phone number was verified through OTP
        verified_key = f"{PHONE_VERIFIED_PREFIX}_{phone_number}"
        verified_data = cache.get(verified_key)
        
        if not verified_data:
            raise APIError(UserAccountError.SIGN_UP_NOT_ALLOWED)
        
        # Phone is verified, proceed with signup
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = cast(User, serializer.save())
        
        # Delete the verification cache after successful signup
        cache.delete(verified_key)
        
        # Generate tokens for auto-login
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        response = Response({
            "message": "Sign Up successfully",
            "user": self.serializer_class(user, context={"request": request}).data
        }, status=status.HTTP_201_CREATED)
        
        # Set cookies after signup
        make_cookie(response, {
            "access_token": access_token,
            "refresh_token": refresh_token,
        })
        
        return response


class UserAPIView(APIView):
    serializer_class = UserProfileSerializer
    
    def get_authentication_classes(self):
        if self.request.method == 'POST':
            # No authentication for signup
            return []
        else:
            return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'POST':
            # No permissions needed for signup
            return [AllowAny()]
        else:
            # Use custom permission for non-POST methods
            return [IsAdmin()]
    
    def get(self, request, pk=None):
        if pk:
            user = User.get_user_by_id(pk)
            serializer = self.serializer_class(
                user, 
                context={"request": request}
            )
            return Response({
                "success": True,
                "user": serializer.data
            })
        else:
            users = User.objects.all()
            serializer = self.serializer_class(
                users,
                context={"request": request}, 
                many=True
            )
            return Response({
                "success": True,
                "users": serializer.data
            })
    
    def put(self, request, pk):
        user = User.get_user_by_id(pk)
        serializer = self.serializer_class(
            user, 
            data=request.data,
            context={"request": request},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "success": True,
            "user": serializer.data
        })
    
    def delete(self, request, pk):
        user = User.get_user_by_id(pk)
        
        if request.user.id == user.id:
            raise APIError(UserAccountError.FORBIDDEN_ACTION) # an admin cant delete its own account
        
        user.delete()
        return Response(status=status.HTTP_200_OK)


class DashboardAPIView(APIView):
    permission_classes = []
    serializer_class = UserProfileSerializer

    def get(self, request):
        """Get current user's profile"""
        user: User = request.user
        serializer = self.serializer_class(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update current user's profile"""
        user: User = request.user
        serializer = self.serializer_class(
            instance=user, 
            data=request.data, 
            context={"request": request}, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        return Response({
            "message": "Profile updated successfully",
            "user": self.serializer_class(updated_user, context={"request": request}).data
        }, status=status.HTTP_200_OK)