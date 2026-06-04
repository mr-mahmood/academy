# football_talent/enrollments/serializers.py
from rest_framework import serializers
from .models import FootballEnrollment
from football_talent.courses.serializers import FootballCourseSerializer
from users.serializers import UserProfileSerializer


class FootballEnrollmentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    course = FootballCourseSerializer(read_only=True)
    
    class Meta:
        model = FootballEnrollment
        fields = [
            'id', 'user', 'course',
            'age_category', 'enrollment_status',
            'enrolled_at', 'updated_at', 'cancelled_at'
        ]
        read_only_fields = [
            'id', 'enrolled_at', 'updated_at', 'cancelled_at', 'age_category'
        ]
    
    def get_age_category_display(self, obj):
        return obj.get_age_category_display()