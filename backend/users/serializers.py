# users/serializers.py
from rest_framework import serializers
from users.models import User
from users.validators import validate_phone_number, validate_national_id
from datetime import datetime, date
from core.exceptions import APIError, UserRoleError, UserAccountError

class UserProfileSerializer(serializers.ModelSerializer):
    # Core fields
    phone_number = serializers.CharField()
    national_id = serializers.CharField()
    full_name = serializers.CharField()

    gender = serializers.ChoiceField(choices=User.Gender.choices)
    
    # Add timestamp field (write-only)
    birth_date_timestamp = serializers.IntegerField(write_only=True, required=False)
    birth_date = serializers.DateField(required=False, allow_null=True, read_only=True)
    
    # Address fields
    state = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    profile_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            "id", 
            "phone_number",
            "national_id",
            "full_name",
            "gender",
            "role",
            "birth_date_timestamp",
            "birth_date",
            "age_category",
            "is_active",
            "state",
            "city",
            "address",
            "profile_image", 
            "created_at", 
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "birth_date", "age_category"]
    
    # ==============================================================
    # Validation
    # ==============================================================
    def validate(self, attrs):
        request = self.context["request"]
        acting_user = request.user
        user_being_edited = self.instance
        is_create = user_being_edited is None
        
        # Skip role/permission checks for CREATE operations (sign up)
        if is_create:
            return attrs
        
        # Only proceed with validation for UPDATE operations
        # At this point, acting_user should be authenticated, but let's be safe
        if not acting_user.is_authenticated:
            raise APIError(UserAccountError.FORBIDDEN_ACTION)
        
        acting_role = acting_user.role
        is_update_self = acting_user.id == user_being_edited.id
        new_role = attrs.get("role")
        new_is_active = attrs.get("is_active")
        
        # --- UPDATE MODE VALIDATION ---
        # --- UPDATE ITS OWN INFO ---
        if is_update_self:
            # CORE RULE 1: No one can change their own role
            if new_role and new_role != acting_role:
                raise APIError(UserRoleError.NOT_ALLOW_CHANGE_ROLE)
            
            # CORE RULE 2: Cannot change your own account active status
            if new_is_active and new_is_active != acting_user.is_active:
                raise APIError(UserRoleError.NOT_ALLOW_CHANGE_ACTIVE_STATUS)
        
        # If all checks pass, return the data
        return attrs

    def validate_national_id(self, value):
        return validate_national_id(value, instance=self.instance)
    
    def validate_phone_number(self, value):
        return validate_phone_number(value, instance=self.instance)
    
    def validate_full_name(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters")
        return value.strip()

    def validate_birth_date_timestamp(self, value):
        """Convert timestamp to date and validate"""
        try:
            # Convert timestamp from milliseconds to seconds
            timestamp_seconds = value / 1000.0
            # Convert to datetime using Django's timezone
            dt = datetime.fromtimestamp(timestamp_seconds)
            date_obj = dt.date()
            
            # Check if date is not in future
            if date_obj > date.today():
                raise serializers.ValidationError("Birth date cannot be in the future")
            
            # Store the converted date in validated_data
            self.context['converted_birth_date'] = date_obj
            return value
        except Exception as e:
            raise serializers.ValidationError(f"Invalid birth date timestamp: {str(e)}")
    
    # ==============================================================
    # Create logic
    # ==============================================================
    def create(self, validated_data):
        """Create a new user"""
        # Extract timestamp
        birth_date_timestamp = validated_data.pop('birth_date_timestamp', None)
        
        if birth_date_timestamp:
            # Get the converted date from context
            birth_date = self.context.get('converted_birth_date')
            if birth_date:
                validated_data['birth_date'] = birth_date
        
        return User.objects.create_user(**validated_data)
    
    # ==============================================================
    # Update logic
    # ==============================================================
    def update(self, instance: User, validated_data):
        """Update an existing user"""

        # Extract timestamp
        birth_date_timestamp = validated_data.pop('birth_date_timestamp', None)
        
        if birth_date_timestamp:
            # Get the converted date from context
            birth_date = self.context.get('converted_birth_date')
            if birth_date:
                validated_data['birth_date'] = birth_date
        
        # Handle profile_image separately
        profile_image_file = validated_data.pop("profile_image", None)
        if profile_image_file is not None:
            instance.profile_image = profile_image_file
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance