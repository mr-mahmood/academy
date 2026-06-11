from django.contrib import admin
from .models import FootballCourse
from .utils import export_football_courses_to_excel
from config.admin import admin_site


class FootballCourseAdmin(admin.ModelAdmin):
    """Simple Football Course admin"""
    
    list_display = [
        'id', 'academy', 'position', 'gender_requirement',
        'price', 'status'
    ]
    
    list_filter = ['status', 'position', 'academy']
    
    search_fields = ['coache', 'academy__name']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'academy', 'position', 'gender_requirement', 'coache',
                'price', 'status'
            )
        }),
    )
    
    actions = ['activate_courses', 'cancel_courses', 'mark_completed', 'export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected football courses to Excel"""
        return export_football_courses_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"
    
    def activate_courses(self, request, queryset):
        updated = queryset.update(status=FootballCourse.Status.ACTIVE)
        self.message_user(request, f"{updated} course(s) activated.")
    activate_courses.short_description = "Activate selected courses"
    
    def cancel_courses(self, request, queryset):
        updated = queryset.update(status=FootballCourse.Status.CANCELLED)
        self.message_user(request, f"{updated} course(s) cancelled.")
    cancel_courses.short_description = "Cancel selected courses"
    
    def mark_completed(self, request, queryset):
        updated = queryset.update(status=FootballCourse.Status.COMPLETED)
        self.message_user(request, f"{updated} course(s) marked as completed.")
    mark_completed.short_description = "Mark as completed"


# Register with custom admin site
admin_site.register(FootballCourse, FootballCourseAdmin)