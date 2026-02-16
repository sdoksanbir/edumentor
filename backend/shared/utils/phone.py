"""
Türkiye telefon numarası normalize ve format yardımcıları.
"""
from rest_framework import serializers


def normalize_tr_phone(s: str | None) -> str:
    """
    Türkiye cep telefonu numarasını normalize eder ve 0(5xx) xxx xx xx formatında döner.
    Geçersiz format için ValidationError fırlatır.

    Kabul edilen girişler:
    - 05551234567
    - 5551234567
    - +905551234567
    - +90 555 123 45 67
    - 0 555 123 45 67
    vb.

    Çıkış: 0(555) 123 45 67
    """
    if s is None or (isinstance(s, str) and not s.strip()):
        return ""
    if not isinstance(s, str):
        s = str(s)
    # Sadece rakamları al
    digits = "".join(c for c in s if c.isdigit())
    # +90 başında varsa çıkar (12 hane -> 10 hane)
    if len(digits) == 12 and digits.startswith("90"):
        digits = digits[2:]
    # 0 ile başlamıyorsa ve 10 hane ise başına 0 ekle
    if len(digits) == 10 and not digits.startswith("0"):
        digits = "0" + digits
    # 11 hane olmalı: 0 + 10 rakam (5xx ile başlamalı)
    if len(digits) != 11:
        raise serializers.ValidationError("Telefon numarası geçersiz. 11 haneli olmalı (0xxxxxxxxxx).")
    if not digits.startswith("05"):
        raise serializers.ValidationError(
            "Telefon numarası 0(5xx) ile başlamalı."
        )
    # Format: 0(5xx) xxx xx xx
    return f"0({digits[1:4]}) {digits[4:7]} {digits[7:9]} {digits[9:11]}"
