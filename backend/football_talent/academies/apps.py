from django.apps import AppConfig


class AcademiesConfig(AppConfig):
    name = 'football_talent.academies'
    label = 'football_academies'  # ← Unique label
    verbose_name = 'Football Academies'
