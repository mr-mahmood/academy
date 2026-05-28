
from django.urls import path
from . import views

app_name = 'payment'

urlpatterns = [
    path('initiate/', views.InitiatePaymentAPIView.as_view(), name='initiate'),
    path('callback/', views.PaymentCallbackAPIView.as_view(), name='callback'),
    path('status/<str:res_num>/', views.PaymentStatusAPIView.as_view(), name='status'),
]