from django.urls import path
from .views import SportAPIView

app_name = 'sports'

urlpatterns = [
    path("", SportAPIView.as_view(), name="all_sports"),
    path("<int:pk>/", SportAPIView.as_view(), name="sport"),
]
