from django.contrib import admin
from .models import Sport
from config.admin import admin_site

# Register your models here.
@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_display_links = ['name']
    search_fields = ['name']
    

# Register explicitly
admin_site.register(Sport, SportAdmin)