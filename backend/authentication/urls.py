from django.urls import path
from authentication.views import RefreshAPIView, LogoutAPIView, RequestOTPApiView, VerifyOTPApiView

app_name = 'authentication'

urlpatterns = [
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("refresh/", RefreshAPIView.as_view(), name="refresh"),
    path('request-otp/', RequestOTPApiView.as_view(), name='request_otp'),
    path('verify-otp/', VerifyOTPApiView.as_view(), name='verify_otp'),
]
