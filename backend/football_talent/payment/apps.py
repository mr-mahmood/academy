from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    name = 'football_talent.payment'
    label = 'football_payment'  # ← Unique label
    verbose_name = 'Football Payment'