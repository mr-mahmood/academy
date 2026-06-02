from django.contrib import admin
from .models import Academy
from config.admin import admin_site

class AcademyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'is_active']
    list_display_links = ['name']
    
    
# Register explicitly
admin_site.register(Academy, AcademyAdmin)