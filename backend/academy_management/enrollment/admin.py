# academy_management/enrollment/admin.py
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Enrollment
from config.admin import admin_site


class EnrollmentAdmin(admin.ModelAdmin):
    """Simple Enrollment admin"""
    
    list_display = ['id', 'user_link', 'course_link', 'enrollment_status', 'enrolled_at']
    
    list_filter = ['enrollment_status']
    
    search_fields = ['user__full_name', 'user__phone_number', 'course__sport__name']
    
    readonly_fields = ['enrolled_at', 'updated_at']
    
    fieldsets = (
        ('Enrollment Info', {
            'fields': ('user', 'course')
        }),
        ('Status', {
            'fields': ('enrollment_status',)
        }),
        ('Timestamps', {
            'fields': ('enrolled_at', 'updated_at', 'cancelled_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_confirmed', 'mark_cancelled']
    
    def user_link(self, obj):
        """Link to user in admin"""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.full_name)
    user_link.short_description = "User"
    
    def course_link(self, obj):
        """Link to course in admin"""
        url = reverse('admin:courses_course_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course)
    course_link.short_description = "Course"
    
    def mark_confirmed(self, request, queryset):
        """Mark selected enrollments as confirmed"""
        updated = queryset.update(
            enrollment_status=Enrollment.EnrollmentStatus.CONFIRMED
        )
        self.message_user(request, f"{updated} enrollment(s) marked as confirmed.")
    mark_confirmed.short_description = "Mark as Confirmed"
    
    def mark_cancelled(self, request, queryset):
        """Mark selected enrollments as cancelled"""
        from django.utils import timezone
        updated = queryset.update(
            enrollment_status=Enrollment.EnrollmentStatus.CANCELLED,
            cancelled_at=timezone.now()
        )
        self.message_user(request, f"{updated} enrollment(s) marked as cancelled.")
    mark_cancelled.short_description = "Mark as Cancelled"

# Register explicitly
admin_site.register(Enrollment, EnrollmentAdmin)