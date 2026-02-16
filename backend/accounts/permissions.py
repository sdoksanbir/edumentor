from rest_framework.permissions import BasePermission, SAFE_METHODS


def _is_admin(user):
    if not user or not user.is_authenticated:
        return False
    return (
        getattr(user, "role", None) == "ADMIN"
        or user.is_staff
        or user.is_superuser
    )


def _is_approved(user):
    """Admin her zaman onaylı; diğerleri is_approved alanına bakılır."""
    if not user or not user.is_authenticated:
        return False
    if _is_admin(user):
        return True
    return getattr(user, "is_approved", False)


class IsApprovedUser(BasePermission):
    """
    SAFE_METHODS (GET, HEAD, OPTIONS): authenticated kullanıcılar erişebilir.
    WRITE (POST, PUT, PATCH, DELETE): sadece onaylı kullanıcılar.
    Admin her zaman onaylı sayılır.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return _is_approved(request.user)


class IsAdminOnly(BasePermission):
    """Tüm işlemler sadece ADMIN."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and _is_admin(request.user)
        )
