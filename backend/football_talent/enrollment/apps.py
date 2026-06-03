from django.apps import AppConfig


class EnrollmentsConfig(AppConfig):
    name = 'football_talent.enrollment'
    label = 'football_enrollment'  # ← Unique label
    verbose_name = 'Football Enrollment'