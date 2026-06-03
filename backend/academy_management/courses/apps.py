from django.apps import AppConfig


class CoursesConfig(AppConfig):
    name = 'academy_management.courses'
    label = 'academy_courses'  # ← Unique label
    verbose_name = 'Academy Courses'
