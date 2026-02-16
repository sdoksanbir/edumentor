"""
Türkçe locale uyumlu string yardımcıları.
"""

import re


def tr_capitalize_first(s: str | None) -> str:
    """
    İlk harfi Türkçe kurallarına göre büyütür (i->İ, ı->I).
    Çoklu boşlukları tek boşluğa indirir, strip uygular.
    None/boş string için "" döner.
    """
    if s is None:
        return ""
    t = s.strip()
    if not t:
        return ""
    # Çoklu boşlukları tek boşluğa indir
    parts = t.split()
    t = " ".join(parts)
    if not t:
        return ""
    first = t[0]
    rest = t[1:]
    # Türkçe i/ı özel durumları
    if first == "i":
        first_up = "İ"
    elif first == "ı":
        first_up = "I"
    else:
        first_up = first.upper()  # ç,ğ,ş,ö,ü için Python upper yeterli
    return first_up + rest


def tr_upper(s: str | None) -> str:
    """
    Tüm stringi Türkçe kurallarına göre büyük harfe çevirir (i->İ, ı->I).
    Çoklu boşlukları tek boşluğa indirir, strip uygular.
    """
    if s is None:
        return ""
    t = s.strip()
    if not t:
        return ""
    parts = t.split()
    t = " ".join(parts)
    # Python'da toLocaleUpperCase yok; manuel i/ı dönüşümü
    result = []
    for c in t:
        if c == "i":
            result.append("İ")
        elif c == "ı":
            result.append("I")
        else:
            result.append(c.upper())
    return "".join(result)


def tr_lower(s: str | None) -> str:
    """
    Tüm stringi Türkçe kurallarına göre küçük harfe çevirir (I->ı, İ->i).
    Çoklu boşlukları tek boşluğa indirir, strip uygular.
    """
    if s is None:
        return ""
    t = s.strip()
    if not t:
        return ""
    parts = t.split()
    t = " ".join(parts)
    result = []
    for c in t:
        if c == "I":
            result.append("ı")
        elif c == "İ":
            result.append("i")
        else:
            result.append(c.lower())
    return "".join(result)


def tr_title(s: str | None) -> str:
    """
    Türkçe kurallarına göre title-case uygular: her kelimenin ilk harfi büyük.
    Örn: "mehmet ali" -> "Mehmet Ali", "ışık i̇lker" -> "Işık İlker"

    - strip + çoklu boşluk tek boşluk
    - Kelime içindeki '-' ve "'" ayraçlarını korur (Ali-Kemal, O'Neill)
    - Kelimelerin geri kalanı Türkçe kurallarıyla küçültülür
    """
    if s is None:
        return ""
    t = s.strip()
    if not t:
        return ""
    t = " ".join(t.split())
    if not t:
        return ""

    def _cap_segment(seg: str) -> str:
        if not seg:
            return ""
        lower = tr_lower(seg)
        if not lower:
            return ""
        first = lower[0]
        rest = lower[1:]
        if first == "i":
            first_up = "İ"
        elif first == "ı":
            first_up = "I"
        else:
            first_up = first.upper()
        return first_up + rest

    out_words: list[str] = []
    for word in t.split(" "):
        # split on hyphen/apostrophe but keep separators
        parts = re.split(r"([-'])", word)
        capped_parts: list[str] = []
        for p in parts:
            if p in ("-", "'"):
                capped_parts.append(p)
            else:
                capped_parts.append(_cap_segment(p))
        out_words.append("".join(capped_parts))

    return " ".join(out_words)
