from django.urls import path
from .views import AcademyAPIView

app_name = 'academies'

urlpatterns = [
    path("", AcademyAPIView.as_view(), name="all_academies"),
    path("<int:pk>/", AcademyAPIView.as_view(), name="academy"),
]
