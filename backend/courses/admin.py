# apps/classes/admin.py
from django.contrib import admin
from .models import Course, CourseSchedule


class CourseScheduleInline(admin.TabularInline):
    """Inline schedule entries"""
    model = CourseSchedule
    extra = 0
    fields = ['weekday', 'start_time', 'end_time']


@admin.register(Course)
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
                'total_sessions', 'enrolled_students', 'max_students', 'price', 'instructor_name',
                'status'
            )
        }),
    )
    
    inlines = [CourseScheduleInline]
    
    actions = ['make_active', 'make_draft', 'make_full']
    
@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    """Simple Course Schedule admin"""
    
    list_display = ['id', 'course', 'get_weekday_display', 'start_time', 'end_time']
    
    list_filter = ['weekday', 'course__sport', 'course__academy']
    
    raw_id_fields = ['course']