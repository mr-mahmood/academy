from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import FootballEnrollment
from config.admin import admin_site


class FootballEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_link', 'course_link', 'enrollment_status', 'enrolled_at']
    list_filter = ['enrollment_status']
    search_fields = ['user__full_name', 'user__phone_number', 'course__academy__name']
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
                url = reverse('admin:football_courses_footballcourse_change', args=[obj.course.id])
                return format_html('<a href="{}">{}</a>', url, obj.course)
            except:
                return str(obj.course)
        return "-"
    course_link.short_description = "Course"
    
    def mark_confirmed(self, request, queryset):
        updated = queryset.update(enrollment_status=FootballEnrollment.EnrollmentStatus.CONFIRMED)
        self.message_user(request, f"{updated} enrollment(s) marked as confirmed.")
    mark_confirmed.short_description = "Mark as Confirmed"
    
    def mark_cancelled(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            enrollment_status=FootballEnrollment.EnrollmentStatus.CANCELLED,
            cancelled_at=timezone.now()
        )
        self.message_user(request, f"{updated} enrollment(s) marked as cancelled.")
    mark_cancelled.short_description = "Mark as Cancelled"


admin_site.register(FootballEnrollment, FootballEnrollmentAdmin)