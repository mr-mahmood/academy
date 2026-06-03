from django.apps import AppConfig


class SportsConfig(AppConfig):
    name = 'academy_management.sports'
    label = 'academy_sports'  # ← Unique label
    verbose_name = 'Academy Management Sports'
