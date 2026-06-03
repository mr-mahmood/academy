from django.urls import path
from .views import FootballEnrollmentAPIView

app_name = 'football_enrollments'

urlpatterns = [
    path('', FootballEnrollmentAPIView.as_view(), name='enrollment_list_create'),
    path('<int:pk>/', FootballEnrollmentAPIView.as_view(), name='enrollment_detail'),
]