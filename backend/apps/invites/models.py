import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class InviteToken(models.Model):
    """One-time invite: admin generates a token, shares the link manually,
    and the contributor registers through it."""

    token = models.CharField(max_length=64, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_invites'
    )
    note = models.CharField(max_length=200, blank=True)  # e.g. "For CSC class rep"
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='used_invites',
    )
    used_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite {self.token[:8]}… (used: {self.is_used})"

    @classmethod
    def generate(cls, created_by, note: str = '', expires_days: int = 7) -> 'InviteToken':
        token = secrets.token_urlsafe(32)
        return cls.objects.create(
            token=token,
            created_by=created_by,
            note=note,
            expires_at=timezone.now() + timezone.timedelta(days=expires_days),
        )

    def is_valid(self) -> bool:
        return not self.is_used and not self.is_revoked and timezone.now() < self.expires_at

    def use(self, user) -> bool:
        if not self.is_valid():
            return False
        self.is_used = True
        self.used_by = user
        self.used_at = timezone.now()
        self.save()
        return True


class PasswordResetToken(models.Model):
    """Admin-generated one-time token letting a user set a new password
    without email infrastructure — the admin shares the /reset/{token} link
    manually, exactly like an invite."""

    token = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_password_resets',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Password reset for {self.user.username} (used: {self.is_used})"

    @classmethod
    def generate(cls, user, created_by, hours: int = 24) -> 'PasswordResetToken':
        # one live token per user: issuing a new one voids the old link
        cls.objects.filter(user=user, is_used=False).delete()
        return cls.objects.create(
            token=secrets.token_urlsafe(32),
            user=user,
            created_by=created_by,
            expires_at=timezone.now() + timezone.timedelta(hours=hours),
        )

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

    def use(self) -> None:
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
