from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class PortalUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'department', 'is_active_contributor')
    list_filter = ('role', 'is_active_contributor')
    fieldsets = UserAdmin.fieldsets + (
        ('Portal', {'fields': ('role', 'full_name', 'department', 'is_active_contributor')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Portal', {'fields': ('role', 'full_name', 'department')}),
    )
