from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminForWrite(BasePermission):
    """
    GET herkes (auth olanlar) görebilsin.
    POST/PUT/PATCH/DELETE sadece ADMIN.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "ADMIN"


class IsAdminOnly(BasePermission):
    """
    Tüm CRUD işlemleri sadece ADMIN.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (getattr(request.user, "role", None) == "ADMIN" or request.user.is_staff or request.user.is_superuser)
        )
