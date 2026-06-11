from django.contrib import admin
from .models import Academy
from .utils import export_academies_to_excel
from config.admin import admin_site


class AcademyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'is_active']
    list_display_links = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    # Add Excel export action
    actions = ['export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected academies to Excel"""
        return export_academies_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"


# Register explicitly
admin_site.register(Academy, AcademyAdmin)