from django.db import models
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
        
        # Regular users
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
    # Remove username, email fields only (keep password for admin)
    username = None
    email = None
    
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        USER = "USER", "User"
    
    # Core fields - ALL REQUIRED
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
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    
    # Address fields (optional)
    state = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name="State"
    )
    city = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name="City"
    )
    address = models.TextField(
        blank=True,
        verbose_name="Address"
    )
    
    # Optional fields
    profile_image = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True,
        default='profile_pics/default_profile_image.png',
        verbose_name="Profile Image"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created At"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At"
    )
    
    # one session only logic
    token_version = models.IntegerField(default=1)
    
    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["national_id", "full_name"]
    
    objects = UserManager()  # type: ignore
    
    class Meta:
        db_table = "user"
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"
    
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
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Clear individual cache
        CacheService.invalidate_model(self.__class__, self.pk)
        
        # Clear phone number lookup cache
        cache.delete(f"user:phone:{self.phone_number}")
        
        # Clear list caches
        cache.delete("users:all_list")
        cache.delete("users:active_list")
    
    def delete(self, *args, **kwargs):
        user_id = self.pk
        phone_number = self.phone_number
        super().delete(*args, **kwargs)
        
        # Clear cache
        CacheService.invalidate_model(self.__class__, user_id)
        cache.delete(f"user:phone:{phone_number}")
        cache.delete("users:all_list")
        cache.delete("users:active_list")