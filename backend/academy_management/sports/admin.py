from django.contrib import admin
from .models import Sport

# Register your models here.
@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_display_links = ['name']