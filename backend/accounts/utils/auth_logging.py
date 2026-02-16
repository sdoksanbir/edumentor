"""
Auth event logging utility. IP ve user_agent request.META'dan alınır.
"""
from accounts.models import AuthEventLog


def _get_client_ip(request):
    if not request:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _get_user_agent(request):
    if not request:
        return ""
    return request.META.get("HTTP_USER_AGENT", "")[:500]


def log_auth_event(request, event_type, user=None, meta=None):
    """Auth event log kaydı oluşturur."""
    try:
        m = dict(meta) if meta else {}
        if request and request.META.get("HTTP_X_FORWARDED_FOR"):
            m["x_forwarded_for"] = request.META["HTTP_X_FORWARDED_FOR"]
        final_meta = m if m else None
        AuthEventLog.objects.create(
            user=user,
            event_type=event_type,
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request),
            meta=final_meta,
        )
    except Exception:
        pass  # Log hatası uygulama akışını bozmasın
