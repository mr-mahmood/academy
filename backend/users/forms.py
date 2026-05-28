# users/forms.py
from django import forms
from django.core.exceptions import ValidationError
from sympy import true
from users.models import User
from users.validators import validate_national_id, validate_phone_number


class UserCreationForm(forms.ModelForm):
    """Form for creating new users in admin panel"""
    
    class Meta:
        model = User
        fields = (
            "phone_number",
            "national_id",
            "full_name",
            "gender",
            "birth_date",
            "state",
            "city",
            "address",
            "profile_image",
            "is_active",
            "is_staff",
            "is_superuser",
        )
        widgets = {
            'phone_number': forms.TextInput(attrs={'placeholder': '09XXXXXXXXX'}),
            'national_id': forms.TextInput(attrs={'placeholder': '1234567890'}),
            'full_name': forms.TextInput(attrs={'placeholder': 'First and Last name'}),
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
            'state': forms.TextInput(attrs={'placeholder': 'Province/State'}),
            'city': forms.TextInput(attrs={'placeholder': 'City'}),
            'address': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Full address'}),
        }
    
    def clean_phone_number(self):
        """Validate phone number format and uniqueness"""
        phone = self.cleaned_data.get("phone_number")
        validate_phone_number(phone)        
        return phone
    
    def clean_national_id(self):
        """Validate national ID format and uniqueness"""
        national_id = self.cleaned_data.get("national_id")
        validate_national_id(national_id)
        return national_id
    
    def clean_birth_date(self):
        """Validate birth date is not in future"""
        from datetime import date
        birth_date = self.cleaned_data.get("birth_date")
        
        if birth_date and birth_date > date.today():
            raise ValidationError("Birth date cannot be in the future.")

        return birth_date


class UserChangeForm(forms.ModelForm):
    """Form for editing existing users in admin panel"""
    
    class Meta:
        model = User
        fields = (
            "id",
            "phone_number",
            "national_id",
            "full_name",
            "gender",
            "birth_date",
            "state",
            "city",
            "address",
            "profile_image",
            "is_active",
            "is_staff",
            "is_superuser",
        )
        read_only_fields = ("id",)
        widgets = {
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }
    
    def clean_phone_number(self):
        """Validate phone number format and uniqueness (excluding current user)"""
        user = self.instance
        phone = self.cleaned_data.get("phone_number")
        validate_phone_number(phone, user, admin_panel=True)
        return phone
    
    def clean_national_id(self):
        """Validate national ID format and uniqueness (excluding current user)"""
        user = self.instance
        national_id = self.cleaned_data.get("national_id")
        validate_national_id(national_id, instance=user, admin_panel=True)
        return national_id
    
    def clean_birth_date(self):
        """Validate birth date is not in future"""
        from datetime import date
        birth_date = self.cleaned_data.get("birth_date")
        if birth_date and birth_date > date.today():
            raise ValidationError("Birth date cannot be in the future.")
        return birth_date