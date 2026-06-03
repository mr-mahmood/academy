from django.urls import path
from .views import InitiateFootballPaymentAPIView, FootballPaymentCallbackAPIView, FootballPaymentStatusAPIView

app_name = 'football_payments'

urlpatterns = [
    path('initiate/', InitiateFootballPaymentAPIView.as_view(), name='initiate'),
    path('callback/', FootballPaymentCallbackAPIView.as_view(), name='callback'),
    path('status/<str:res_num>/', FootballPaymentStatusAPIView.as_view(), name='status'),
]