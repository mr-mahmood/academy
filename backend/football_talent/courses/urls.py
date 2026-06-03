from django.urls import path
from .views import FootballCourseAPIView

app_name = 'football_courses'

urlpatterns = [
    path('', FootballCourseAPIView.as_view(), name='course_list_create'),
    path('<int:pk>/', FootballCourseAPIView.as_view(), name='course_detail'),
    path('academy/<int:academy_id>/', FootballCourseAPIView.as_view(), name='academy_courses'),
]