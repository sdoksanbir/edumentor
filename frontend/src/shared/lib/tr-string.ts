/**
 * Türkçe locale uyumlu string yardımcıları.
 * İlk harf büyük: "ahmet" => "Ahmet", "istanbul" => "İstanbul", "ışık" => "Işık"
 * Tümü büyük: "yılmaz" => "YILMAZ" (i->İ, ı->I)
 */

/**
 * İlk harfi Türkçe kurallarına göre büyütür (i->İ, ı->I).
 * strip + çoklu boşluk tek boşluk.
 */
export function trCapitalizeFirst(s: string): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ")
  if (!t) return ""
  const first = t[0]
  const firstUp =
    first === "i"
      ? "İ"
      : first === "ı"
        ? "I"
        : first.toLocaleUpperCase("tr-TR")
  return firstUp + t.slice(1)
}

/**
 * Tüm stringi Türkçe kurallarına göre büyük harfe çevirir (i->İ, ı->I).
 * strip + çoklu boşluk tek boşluk.
 * toLocaleUpperCase("tr-TR") zaten i->İ, ı->I dönüşümünü yapar.
 */
export function trUpper(s: string): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ")
  if (!t) return ""
  return t.toLocaleUpperCase("tr-TR")
}

/**
 * Her kelimenin ilk harfini Türkçe kurallarına göre büyütür (i->İ, ı->I).
 * "mehmet ali" -> "Mehmet Ali", "ışık yılmaz" -> "Işık Yılmaz"
 * Baştaki boşlukları temizler, çoklu boşluğu tek boşluğa indirir, sondaki boşluğu korur (yazarken).
 */
export function trTitle(s: string): string {
  const t = (s ?? "").replace(/^\s+/, "").replace(/\s+/g, " ")
  if (!t) return ""
  return t
    .split(" ")
    .map((word) => (word ? trCapitalizeFirst(word) : ""))
    .join(" ")
}
