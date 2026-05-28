from django.urls import path
from users.views import DashboardAPIView, UserAPIView, UserSignupAPIView

app_name = 'users'

urlpatterns = [
    path("", UserAPIView.as_view(), name="all_users"),
    path("<int:pk>/", UserAPIView.as_view(), name="users"),
    path('signup/', UserSignupAPIView.as_view(), name='user-signup'),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
]
