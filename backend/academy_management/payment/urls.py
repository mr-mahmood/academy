
from django.urls import path
from .views import InitiatePaymentAPIView, PaymentCallbackAPIView, PaymentStatusAPIView

app_name = 'payment'

urlpatterns = [
    path('initiate/', InitiatePaymentAPIView.as_view(), name='initiate'),
    path('callback/', PaymentCallbackAPIView.as_view(), name='callback'),
    path('status/<str:res_num>/', PaymentStatusAPIView.as_view(), name='status'),
]