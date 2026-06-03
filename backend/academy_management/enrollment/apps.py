from django.apps import AppConfig


class EnrollmentConfig(AppConfig):
    name = 'academy_management.enrollment'
    label = 'academy_enrollment'  # ← Unique label
    verbose_name = 'Academy Enrollment'
