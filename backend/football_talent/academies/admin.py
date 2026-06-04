from django.contrib import admin
from .models import FootballAcademy
from config.admin import admin_site

class FootballAcademyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'phone', 'is_active']
    list_display_links = ['name']
    readonly_fields = ['created_at', 'updated_at']

# Register explicitly with custom admin site
admin_site.register(FootballAcademy, FootballAcademyAdmin)