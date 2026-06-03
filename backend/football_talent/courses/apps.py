from django.apps import AppConfig


class CoursesConfig(AppConfig):
    name = 'football_talent.courses'
    label = 'football_courses'  # ← Unique label
    verbose_name = 'Football Courses'
