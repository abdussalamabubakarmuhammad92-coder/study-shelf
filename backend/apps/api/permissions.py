from rest_framework.permissions import BasePermission


class IsPortalAdmin(BasePermission):
    """Allows access to users with the portal 'admin' role or Django superusers."""

    message = 'Only portal administrators can perform this action.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and
                    (user.is_superuser or getattr(user, 'role', '') == 'admin'))


class IsAuthenticatedContributor(BasePermission):
    """Any authenticated, active contributor can upload."""

    message = 'You need a valid contributor account to upload.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and
                    getattr(user, 'is_active_contributor', True))


class IsOwnerOrAdmin(BasePermission):
    """Object-level: the resource's uploader or a portal admin may modify it."""

    message = 'Only the uploader or a portal admin can modify this resource.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active)

    def has_object_permission(self, request, view, obj):
        user = request.user
        return (obj.uploaded_by_id == user.id
                or user.is_superuser
                or getattr(user, 'role', '') == 'admin')
