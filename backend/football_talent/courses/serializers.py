from rest_framework import serializers
from django.utils import timezone
from .models import FootballCourse
from core.exceptions import APIError, AcademyError, ClassError
from football_talent.academies.serializers import FootballAcademySerializer


class FootballCourseSerializer(serializers.ModelSerializer):
    available_seats = serializers.IntegerField(read_only=True)
    can_register = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    
    # Display names for choices
    age_category_display = serializers.SerializerMethodField()
    position_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    # Nested serializers for read
    academy = FootballAcademySerializer(read_only=True)
    
    class Meta:
        model = FootballCourse
        fields = [
            'id', 'academy', 'coache',
            'age_category', 'age_category_display',
            'position', 'position_display', 'test_date',
            'max_participants', 'current_participants', 'available_seats',
            'price', 'status', 'status_display',
            'can_register', 'is_upcoming', 'is_past',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_participants', 'created_at', 'updated_at']
    
    def get_age_category_display(self, obj):
        return obj.get_age_category_display()
    
    def get_position_display(self, obj):
        return obj.get_position_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def validate_test_date(self, value):
        """Validate test date is in the future"""
        if value < timezone.now():
            raise APIError(ClassError.INVALID_TEST_DATE)
        return value
    
    def validate_max_participants(self, value):
        """Validate max participants"""
        if value <= 0:
            raise APIError(ClassError.INVALID_MAX_PARTICIPANTS)
        return value
    
    def validate_price(self, value):
        """Validate price"""
        if value < 0:
            raise APIError(ClassError.INVALID_PRICE)
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Check if age_category is valid (not OUT_OF_RANGE)
        age_category = attrs.get('age_category')
        if age_category and age_category == 'OOR':
            raise APIError(ClassError.INVALID_AGE_CATEGORY)
        
        # Check if test_date is provided
        test_date = attrs.get('test_date')
        if not test_date:
            raise APIError(ClassError.TEST_DATE_REQUIRED)
        
        return attrs
    
    def create(self, validated_data):
        """Create football course with academy_id"""
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
        """Update football course with optional academy_id"""
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