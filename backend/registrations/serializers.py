from rest_framework import serializers
from .models import Enrollment
from courses.serializers import CourseSerializer
from users.serializers import UserProfileSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'course',
            'enrollment_status',
            'enrolled_at', 'updated_at', 'cancelled_at'
        ]
        read_only_fields = [
            'id', 'enrolled_at', 'updated_at', 'cancelled_at'
        ]