"""Maintenance mode middleware. Returns 503 when maintenance_enabled=True."""

import re
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

# Lazy import to avoid circular deps
def _get_maintenance_config():
    try:
        from .models import SiteSettings
        obj = SiteSettings.objects.filter(id=1).first()
        if obj and obj.maintenance_enabled:
            return obj.maintenance_message, obj.maintenance_allowed_ips
    except Exception:
        pass
    return None, ""


# Paths that bypass maintenance (admin login + settings API)
BYPASS_PATHS = [
    r"^/api/auth/login/",
    r"^/api/admin/settings/",
    r"^/admin/",  # Django admin
    r"^/api/health/",
    r"^/media/",
    r"^/static/",
]


def _path_bypasses_maintenance(path):
    for pattern in BYPASS_PATHS:
        if re.match(pattern, path):
            return True
    return False


def _get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _ip_in_allowed_list(client_ip, allowed_ips_text):
    if not client_ip or not allowed_ips_text:
        return False
    allowed = [ip.strip() for ip in allowed_ips_text.splitlines() if ip.strip()]
    return client_ip in allowed


class MaintenanceMiddleware(MiddlewareMixin):
    """Returns 503 when maintenance_enabled=True. Bypass: login, settings, allowed IPs."""

    def process_request(self, request):
        msg, allowed_ips = _get_maintenance_config()
        if msg is None:
            return None  # maintenance off

        # Bypass: allowed paths
        if _path_bypasses_maintenance(request.path):
            return None

        # Bypass: allowed IPs
        client_ip = _get_client_ip(request)
        if _ip_in_allowed_list(client_ip, allowed_ips):
            return None

        return JsonResponse(
            {"detail": msg, "code": "MAINTENANCE"},
            status=503,
        )
