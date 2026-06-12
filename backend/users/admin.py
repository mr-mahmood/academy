from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from users.models import User
from users.forms import UserCreationForm, UserChangeForm
from config.admin import admin_site
from .utils import export_users_to_excel  


class UserAdmin(BaseUserAdmin):
    """Admin panel configuration for User model"""
    
    # Use the custom forms
    add_form = UserCreationForm
    form = UserChangeForm
    
    # Display fields in list view
    list_display = (
        "id",
        "phone_number",
        "national_id",
        "full_name",
        "gender",
        "age_category",
        "is_active",
        "is_staff",
        "is_superuser",
    )
    
    # Filters in sidebar
    list_filter = (
        "gender",
        "age_category",
        "is_active",
        "is_staff",
    )
    
    # Search fields
    search_fields = (
        "phone_number",
        "national_id",
        "full_name",
    )
    
    list_display_links = ['phone_number']
    
    # Fields order in detail/edit view
    fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "phone_number",
                "national_id",
                "full_name",
                "gender",
                "birth_date",
                "age_category",
                "state",
                "city",
                "address",
                "profile_image",
                "token_version",
                "is_active",
                "is_staff",
                "is_superuser",
            ),
        }),
    )
    
    # Fields for add user form
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
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
            ),
        }),
    )
    
    # Default ordering
    ordering = ["-created_at"]
    
    # Read-only fields
    readonly_fields = (
        "created_at",
        "updated_at",
        "last_login",
    )
    
    # Add Excel export action
    actions = ['export_to_excel']
    
    def export_to_excel(self, request, queryset):
        """Export selected users to Excel"""
        return export_users_to_excel(queryset)
    
    export_to_excel.short_description = "Excel Export"


# Register explicitly
admin_site.register(User, UserAdmin)