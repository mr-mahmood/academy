from django.urls import path
from .views import FootballAcademyAPIView

app_name = 'football_academies'

urlpatterns = [
    path("", FootballAcademyAPIView.as_view(), name="all_football_academies"),
    path("<int:pk>/", FootballAcademyAPIView.as_view(), name="football_academy"),
]