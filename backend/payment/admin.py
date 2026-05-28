from django.contrib import admin
from .models import Payment
from django.urls import reverse
from django.utils.html import format_html


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_link', 'course_link', 'res_num', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['res_num', 'ref_num', 'enrollment__user__full_name', 'enrollment__course__sport__name']
    readonly_fields = ['created_at', 'updated_at', 'description']

    def user_link(self, obj):
        """Link to user in admin"""
        # Check if enrollment exists and has user
        if obj.enrollment and obj.enrollment.user:
            try:
                url = reverse('admin:users_user_change', args=[obj.enrollment.user.id])
                return format_html('<a href="{}">{}</a>', url, obj.enrollment.user.full_name)
            except:
                return str(obj.enrollment.user)
        return "-"
    user_link.short_description = "User"
    
    def course_link(self, obj):
        """Link to course in admin"""
        # Check if enrollment exists and has course
        if obj.enrollment and obj.enrollment.course:
            try:
                url = reverse('admin:courses_course_change', args=[obj.enrollment.course.id])
                return format_html('<a href="{}">{}</a>', url, obj.enrollment.course)
            except:
                return str(obj.enrollment.course)
        return "-"
    course_link.short_description = "Course"