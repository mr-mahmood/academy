# apps/registrations/urls.py
from django.urls import path
from .views import EnrollmentAPIView

app_name = 'registrations'

urlpatterns = [
    path('', EnrollmentAPIView.as_view(), name='enrollment_list_create'),
    path('<int:pk>/', EnrollmentAPIView.as_view(), name='enrollment_detail'),
]