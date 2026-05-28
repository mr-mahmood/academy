# apps/classes/serializers.py
from rest_framework import serializers
from .models import Course, CourseSchedule
from sports.models import Sport
from academies.models import Academy
from core.exceptions import APIError, ClassError
from academies.serializers import AcademySerializer
from sports.serializers import SportSerializer


class CourseScheduleSerializer(serializers.ModelSerializer):
    weekday_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseSchedule
        fields = ['id', 'weekday', 'weekday_name', 'start_time', 'end_time']
        read_only_fields = ['id']
    
    def get_weekday_name(self, obj):
        weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        return weekdays[obj.weekday]
    
    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise APIError(ClassError.INVALID_TIME_RANGE)
        
        return attrs


class CourseSerializer(serializers.ModelSerializer):
    schedule = CourseScheduleSerializer(many=True, required=False)
    available_seats = serializers.IntegerField(read_only=True)
    academy = AcademySerializer(read_only=True)
    sport = SportSerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'sport', 'academy', 'instructor_name',
            'total_sessions', 'max_students', 'enrolled_students', 'available_seats',
            'price', 'gender_requirement', 'status',
            'schedule', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'enrolled_students', 'created_at', 'updated_at']
    
    def validate_max_students(self, value):
        if value <= 0:
            raise APIError(ClassError.INVALID_MAX_STUDENTS)
        return value
    
    def validate_price(self, value):
        if value < 0:
            raise APIError(ClassError.INVALID_PRICE)
        return value
    
    def create(self, validated_data):
        schedule_data = validated_data.pop('schedule', [])
        
        try:
            course = Course.objects.create(**validated_data)
            
            for schedule_entry in schedule_data:
                CourseSchedule.objects.create(course=course, **schedule_entry)
            
            return course
        except Exception:
            raise APIError(ClassError.COURSE_CREATION_FAILED)
    
    def update(self, instance, validated_data):
        schedule_data = validated_data.pop('schedule', None)
        
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            if schedule_data is not None:
                instance.schedule.all().delete()
                for schedule_entry in schedule_data:
                    CourseSchedule.objects.create(course=instance, **schedule_entry)
            
            return instance
        except Exception:
            raise APIError(ClassError.COURSE_UPDATE_FAILED)