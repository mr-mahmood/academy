from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .utils import export_enrollments_to_excel
from .models import Enrollment
from config.admin import admin_site


class EnrollmentAdmin(admin.ModelAdmin):

    list_display = ['id', 'user_link', 'get_phone_number', 'course_link', 'enrollment_status', 'get_reminder_count_display']
    list_filter = ['course', 'enrollment_status']
    search_fields = ['user__full_name', 'user__phone_number', 'course__sport__name']
    readonly_fields = ['enrolled_at', 'updated_at']
    
    fieldsets = (
        ('Enrollment Info', {
            'fields': ('user', 'course')
        }),
        ('Status', {
            'fields': ('enrollment_status', 'reminder_count', 'last_reminder_at')
        }),
        ('Timestamps', {
            'fields': ('enrolled_at', 'updated_at', 'cancelled_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_confirmed', 'mark_cancelled']
    
    # Fixed: Access the phone number through the user object
    @admin.display(description="Phone Number", ordering="user__phone_number")
    def get_phone_number(self, obj):
        return obj.user.phone_number if obj.user else "-"
    
    @admin.display(description="Reminder Count", ordering="reminder_count")
    def get_reminder_count_display(self, obj):
        return obj.reminder_count
    
    def user_link(self, obj):
        if obj.user:
            try:
                url = reverse('admin:users_user_change', args=[obj.user.id])
                return format_html('<a href="{}">{}</a>', url, obj.user.full_name)
            except:
                return str(obj.user.full_name)
        return "-"
    user_link.short_description = "User"
    
    def course_link(self, obj):
        if obj.course:
            try:
                url = reverse('admin:academy_courses_course_change', args=[obj.course.id])
                return format_html('<a href="{}">{}</a>', url, obj.course)
            except:
                return str(obj.course)
        return "-"
    course_link.short_description = "Course name and schedule"
    
    
    # Add Excel export action
    actions = ['export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected enrollments to Excel with multiple sheets"""
        return export_enrollments_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"
    



admin_site.register(Enrollment, EnrollmentAdmin)