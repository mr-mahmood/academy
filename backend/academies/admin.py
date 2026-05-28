from django.contrib import admin
from .models import Academy

# Register your models here.
@admin.register(Academy)
class SportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'is_active']
    list_display_links = ['name']