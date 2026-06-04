# football_talent/courses/serializers.py
from rest_framework import serializers
from .models import FootballCourse
from core.exceptions import APIError, ClassError
from football_talent.academies.serializers import FootballAcademySerializer


class FootballCourseSerializer(serializers.ModelSerializer):
    position_display = serializers.SerializerMethodField()
    academy = FootballAcademySerializer(read_only=True)
    
    class Meta:
        model = FootballCourse
        fields = [
            'id', 'academy', 'coache', 'position', 'position_display',
            'gender_requirement', 'price', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_position_display(self, obj):
        return obj.get_position_display()
    
    def validate_price(self, value):
        if value < 0:
            raise APIError(ClassError.INVALID_PRICE)
        return value
    
    def create(self, validated_data):
        academy = validated_data.pop('academy', None)
        
        if not academy:
            raise APIError(ClassError.FOOTBALL_ACADEMY_REQUIRED)
        
        from football_talent.academies.models import FootballAcademy
        try:
            academy = FootballAcademy.objects.get(id=academy.id)
            validated_data['academy'] = academy
        except FootballAcademy.DoesNotExist:
            raise APIError(ClassError.FOOTBALL_ACADEMY_NOT_EXIST)
        
        try:
            course = FootballCourse.objects.create(**validated_data)
            return course
        except Exception:
            raise APIError(ClassError.FOOTBALL_COURSE_CREATION_FAILED)
    
    def update(self, instance, validated_data):
        academy = validated_data.pop('academy', None)
        
        if academy:
            from football_talent.academies.models import FootballAcademy
            try:
                instance.academy = FootballAcademy.objects.get(id=academy.id)
            except FootballAcademy.DoesNotExist:
                raise APIError(ClassError.FOOTBALL_ACADEMY_NOT_EXIST)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        try:
            instance.save()
            return instance
        except Exception:
            raise APIError(ClassError.FOOTBALL_COURSE_UPDATE_FAILED)