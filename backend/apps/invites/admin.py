from django.contrib import admin

from .models import InviteToken


@admin.register(InviteToken)
class InviteTokenAdmin(admin.ModelAdmin):
    list_display = ('short_token', 'note', 'created_by', 'created_at', 'expires_at', 'status')
    list_filter = ('is_used', 'is_revoked')
    search_fields = ('token', 'note')
    actions = ['revoke_invites']

    @admin.display(description='Token')
    def short_token(self, obj):
        return f"{obj.token[:8]}…"

    @admin.display(description='Status')
    def status(self, obj):
        return 'Used' if obj.is_used else ('Revoked' if obj.is_revoked else
                ('Valid' if obj.is_valid() else 'Expired'))

    @admin.action(description='Revoke selected invites')
    def revoke_invites(self, request, queryset):
        updated = queryset.filter(is_used=False).update(is_revoked=True)
        self.message_user(request, f'{updated} invite(s) revoked.')
