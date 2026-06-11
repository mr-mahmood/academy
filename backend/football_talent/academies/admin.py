from django.contrib import admin
from .models import FootballAcademy
from .utils import export_football_academies_to_excel
from config.admin import admin_site


class FootballAcademyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'phone', 'is_active']
    list_display_links = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    # Add Excel export action
    actions = ['export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected football academies to Excel"""
        return export_football_academies_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"


# Register explicitly with custom admin site
admin_site.register(FootballAcademy, FootballAcademyAdmin)