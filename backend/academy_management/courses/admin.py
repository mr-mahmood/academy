from django.contrib import admin
from .models import Course, CourseSchedule
from .utils import export_courses_to_excel
from config.admin import admin_site


class CourseScheduleInline(admin.TabularInline):
    """Inline schedule entries"""
    model = CourseSchedule
    extra = 0
    fields = ['weekday', 'start_time', 'end_time']


class CourseAdmin(admin.ModelAdmin):
    """Simple Course admin"""
    
    list_display = ['id', 'sport', 'academy', 'instructor_name', 
                    'enrolled_students', 'max_students', 'price', 'gender_requirement', 'status']
    
    list_filter = ['status', 'gender_requirement', 'sport', 'academy']
    
    search_fields = ['instructor_name', 'sport__name', 'academy__name']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'sport', 'academy', 'gender_requirement',
                'total_sessions', 'max_students', 'enrolled_students', 'price', 'instructor_name',
                'status'
            )
        }),
    )
    
    inlines = [CourseScheduleInline]
    
    actions = ['make_active', 'make_draft', 'make_full', 'export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected courses to Excel"""
        return export_courses_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"
    
    def make_active(self, request, queryset):
        queryset.update(status=Course.Status.ACTIVE)
    make_active.short_description = "Mark as Active"
    
    def make_draft(self, request, queryset):
        queryset.update(status=Course.Status.CANCELLED)
    make_draft.short_description = "Mark as Cancelled"
    
    def make_full(self, request, queryset):
        queryset.update(status=Course.Status.FULL)
    make_full.short_description = "Mark as Full"


class CourseScheduleAdmin(admin.ModelAdmin):
    """Simple Course Schedule admin"""
    
    list_display = ['id', 'course', 'get_weekday_display', 'start_time', 'end_time']
    
    list_filter = ['weekday', 'course__sport', 'course__academy']
    
    raw_id_fields = ['course']
    
    
# Register explicitly
admin_site.register(Course, CourseAdmin)
admin_site.register(CourseSchedule, CourseScheduleAdmin)