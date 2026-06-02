from django.urls import path
from .views import CourseAPIView, CourseScheduleAPIView

app_name = 'courses'

urlpatterns = [
    path('', CourseAPIView.as_view(), name='course_list_create'),
    path('<int:pk>/', CourseAPIView.as_view(), name='course_detail'),
    path('<int:course_id>/schedules/', CourseScheduleAPIView.as_view(), name='schedule_of_course'), # give detail of a course
    path('schedules/<int:pk>/', CourseScheduleAPIView.as_view(), name='schedule_detail'), # give times of a course
    path('academies/<int:academy_id>/', CourseAPIView.as_view(), name='academy_courses'), # give add courses of a academy
]