from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from core.exceptions import APIError, UserAccountError
from core.cache_service import CacheService
from django.core.cache import cache

class UserManager(BaseUserManager['User']):
    
    def create_user(self, phone_number, national_id, full_name, **extra_fields):
        """Create regular user - OTP only, no password"""
        if not phone_number:
            raise ValueError("Phone number is required")
        if not national_id:
            raise ValueError("National ID is required")
        if not full_name:
            raise ValueError("Full name is required")
        
        extra_fields.setdefault("role", User.Role.USER)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        
        user = self.model(
            phone_number=phone_number,
            national_id=national_id,
            full_name=full_name,
            **extra_fields
        )
        
        user.set_unusable_password()
        user.save(using=self._db)
        return user
    
    def create_superuser(self, phone_number, national_id, full_name, password, **extra_fields):
        """Create superuser with custom password"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_superuser", True)
        
        user = self.model(
            phone_number=phone_number,
            national_id=national_id,
            full_name=full_name,
            **extra_fields
        )
        
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    id: int
    username = None
    email = None
    
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        USER = "USER", "User"
        
    class AgeCategory(models.TextChoices):
        U12 = "U12", "U12"
        U13 = "U13", "U13"
        U14 = "U14", "U14"
        U15 = "U15", "U15"
        U17 = "U17", "U17"
        U18 = "U18", "U18"
        OUT_OF_RANGE = "OOR", "خارج از محدوده" 
    
    # Core fields
    phone_number = models.CharField(
        max_length=11, 
        unique=True, 
        db_index=True,
        verbose_name="Phone Number"
    )
    
    national_id = models.CharField(
        max_length=10, 
        unique=True,
        verbose_name="National ID"
    )
    
    full_name = models.CharField(
        max_length=200,
        verbose_name="Full Name"
    )
    
    gender = models.CharField(
        max_length=20, 
        choices=Gender.choices, 
        default=Gender.MALE,
        verbose_name="Gender"
    )
    
    birth_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name="Birth Date"
    )
    
    age_category = models.CharField(
        max_length=20,
        choices=AgeCategory.choices,
        default=AgeCategory.OUT_OF_RANGE
    )
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    
    # Address fields
    state = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    
    # Optional fields
    profile_image = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True,
        default='profile_pics/default_profile_image.png',
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Session logic
    token_version = models.IntegerField(default=1)
    
    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["national_id", "full_name"]
    
    objects = UserManager() #type: ignore
    
    class Meta:
        db_table = "user"
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=['birth_date']),
            models.Index(fields=['age_category'])
        ]
    
    def __str__(self):
        return f"{self.phone_number}"
    
    @classmethod
    def get_user_by_phone(cls, phone_number: str) -> 'User':
        """Get user by phone number for OTP verification"""
        try:
            return cls.objects.get(phone_number=phone_number)
        except cls.DoesNotExist:
            raise APIError(UserAccountError.USER_NOT_EXIST)
    
    @classmethod
    def get_user_by_id(cls, user_id: int) -> 'User':
        """Get user by ID with caching"""
        user = CacheService.get_model(cls, user_id, timeout=CacheService.LONG_TIMEOUT)
        if not user:
            raise APIError(UserAccountError.USER_NOT_EXIST)
        return user
    
    def calculate_age_category(self) -> str:
        """Calculate age category based on birth date and current date"""
        if not self.birth_date:
            return User.AgeCategory.OUT_OF_RANGE
        
        current_date = timezone.now().date()
        age = current_date.year - self.birth_date.year
        
        # Adjust if birthday hasn't occurred yet this year
        if (current_date.month, current_date.day) < (self.birth_date.month, self.birth_date.day):
            age -= 1
        
        # CORRECT age category mapping
        if age < 12:
            return User.AgeCategory.U12  # Below U12
        elif age == 12:
            return User.AgeCategory.U12  # 12 years old = U12
        elif age == 13:
            return User.AgeCategory.U13  # 13 years old = U13
        elif age == 14:
            return User.AgeCategory.U14  # 14 years old = U14
        elif age == 15:
            return User.AgeCategory.U15  # 15 years old = U15
        elif age == 16 or age == 17:
            return User.AgeCategory.U17  # 16-17 years old = U17
        elif age == 18 or age == 19:
            return User.AgeCategory.U18  # 18-19 years old = U18
        else:
            return User.AgeCategory.OUT_OF_RANGE
            
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        new_category = self.calculate_age_category()
        
        if self.age_category != new_category:
            self.age_category = new_category
        
        super().save(*args, **kwargs)
        
        # NOW the user has an ID, so we can safely query related enrollments
        if not is_new:  # Only for existing users (updates)
            from football_talent.enrollment.models import FootballEnrollment
            FootballEnrollment.update_all_enrollments_for_user(self)
        
        # Clear caches
        CacheService.invalidate_model(self.__class__, self.pk)
        cache.delete(f"user:phone:{self.phone_number}")
        cache.delete("users:all_list")
        cache.delete("users:active_list")
    
    def delete(self, *args, **kwargs):
        user_id = self.pk
        phone_number = self.phone_number
        super().delete(*args, **kwargs)
        
        CacheService.invalidate_model(self.__class__, user_id)
        cache.delete(f"user:phone:{phone_number}")
        cache.delete("users:all_list")
        cache.delete("users:active_list")