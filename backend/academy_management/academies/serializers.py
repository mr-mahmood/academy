# apps/academies/serializers.py
from rest_framework import serializers
from .models import Academy
from users.validators import validate_phone_number

class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = [
            'id', 'name', 'address_text', 'latitude', 'longitude',
            'phone', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate academy name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Academy name is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Academy name must be at least 2 characters")
        
        # Check for duplicate name (excluding current instance)
        instance = self.instance
        if instance:
            # Update mode - exclude current instance
            if Academy.objects.filter(name__iexact=value.strip()).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError("An academy with this name already exists")
        else:
            # Create mode
            if Academy.objects.filter(name__iexact=value.strip()).exists():
                raise serializers.ValidationError("An academy with this name already exists")
        
        return value.strip()
    
    def validate_phone_number(self, value):
        return validate_phone_number(value, instance=self.instance)
    
    def validate_latitude(self, value):
        if value is not None:
            if value < -90 or value > 90:
                raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value is not None:
            if value < -180 or value > 180:
                raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
    
    def validate(self, attrs):
        # If coordinates are provided, ensure both are provided
        latitude = attrs.get('latitude')
        longitude = attrs.get('longitude')
        
        if (latitude is not None and longitude is None) or (latitude is None and longitude is not None):
            raise serializers.ValidationError("Both latitude and longitude must be provided together")
        
        return attrs
    
    def create(self, validated_data):
        try:
            academy = Academy.objects.create(**validated_data)
            return academy
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create academy: {str(e)}")
    
    def update(self, instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Failed to update academy: {str(e)}")