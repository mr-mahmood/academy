from rest_framework import serializers
from .models import FootballAcademy
from users.validators import validate_phone_number

class FootballAcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = FootballAcademy
        fields = [
            'id', 'name', 'address_text', 'latitude', 'longitude',
            'phone', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate football academy name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Football academy name is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Football academy name must be at least 2 characters")
        
        # Check for duplicate name (excluding current instance)
        instance = self.instance
        if instance:
            if FootballAcademy.objects.filter(name__iexact=value.strip()).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError("A football academy with this name already exists")
        else:
            if FootballAcademy.objects.filter(name__iexact=value.strip()).exists():
                raise serializers.ValidationError("A football academy with this name already exists")
        
        return value.strip()
    
    def validate_phone(self, value):
        """Validate phone number"""
        if value:
            return validate_phone_number(value, instance=self.instance)
        return value
    
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
        """Cross-field validation"""
        latitude = attrs.get('latitude')
        longitude = attrs.get('longitude')
        
        # If coordinates are provided, ensure both are provided
        if (latitude is not None and longitude is None) or (latitude is None and longitude is not None):
            raise serializers.ValidationError("Both latitude and longitude must be provided together")
        
        return attrs
    
    def create(self, validated_data):
        try:
            academy = FootballAcademy.objects.create(**validated_data)
            return academy
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create football academy: {str(e)}")
    
    def update(self, instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Failed to update football academy: {str(e)}")