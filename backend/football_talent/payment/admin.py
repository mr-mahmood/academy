from django.contrib import admin
from .models import FootballPayment
from config.admin import admin_site


class FootballPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'enrollment', 'res_num', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['res_num', 'ref_num']
    readonly_fields = ['created_at', 'updated_at', 'description']


admin_site.register(FootballPayment, FootballPaymentAdmin)