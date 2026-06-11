from django.contrib import admin
from .models import FootballPayment
from .utils import export_football_payments_to_excel
from config.admin import admin_site


class FootballPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'enrollment', 'res_num', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['res_num', 'ref_num']
    readonly_fields = ['created_at', 'updated_at', 'description']
    
    # Add Excel export action
    actions = ['export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected football payments to Excel"""
        return export_football_payments_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"


admin_site.register(FootballPayment, FootballPaymentAdmin)