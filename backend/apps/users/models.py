from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user: admins manage the portal, contributors upload resources."""

    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('contributor', 'Contributor'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='contributor')

    full_name = models.CharField(max_length=100, blank=True)
    department = models.ForeignKey(
        'faculties.Department', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='members',
    )

    is_active_contributor = models.BooleanField(default=True)

    def __str__(self):
        return self.username

    @property
    def is_portal_admin(self):
        return self.role == 'admin' or self.is_superuser
