// src/features/legal/pages/kvkk-page.tsx
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"

const KVKK_CONSENT_KEY = "edumath:kvkk_consent"
const KVKK_VERSION = "2026-02-05"

type ConsentState = {
  accepted: boolean
  acceptedAt?: string
  version?: string
}

function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(KVKK_CONSENT_KEY)
    if (!raw) return { accepted: false }
    const data = JSON.parse(raw) as ConsentState
    return data?.accepted ? data : { accepted: false }
  } catch {
    return { accepted: false }
  }
}

function writeConsent() {
  const payload: ConsentState = {
    accepted: true,
    acceptedAt: new Date().toISOString(),
    version: KVKK_VERSION,
  }
  localStorage.setItem(KVKK_CONSENT_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event("edumath:kvkk-consent-updated"))
  return payload
}

export function KvkkPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"kvkk" | "acikRiza">("kvkk")
  const consent = useMemo(() => readConsent(), [])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">KVKK Bilgilendirme</h1>
        <p className="text-sm text-muted-foreground">
          Sürüm: <span className="font-medium">{KVKK_VERSION}</span>
          {consent.acceptedAt ? (
            <>
              {" "}
              · Son kabul:{" "}
              <span className="font-medium">{new Date(consent.acceptedAt).toLocaleString()}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("kvkk")}
          className={`min-h-10 whitespace-normal rounded-md px-3 py-2 text-sm leading-5 ${
            tab === "kvkk" ? "bg-primary text-primary-foreground" : "border border-border"
          }`}
        >
          KVKK Aydınlatma Metni
        </button>
        <button
          onClick={() => setTab("acikRiza")}
          className={`min-h-10 whitespace-normal rounded-md px-3 py-2 text-sm leading-5 ${
            tab === "acikRiza" ? "bg-primary text-primary-foreground" : "border border-border"
          }`}
        >
          Açık Rıza Metni
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-sm leading-6">
        {tab === "kvkk" ? <KvkkText /> : <AcikRizaText />}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Bu metinleri okuduktan sonra “Kabul Ediyorum” diyerek onay verebilirsin.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted/50 sm:w-auto"
          >
            Geri Dön
          </button>

          <div className="w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => {
                writeConsent()
                navigate(-1)
              }}
              className="w-full sm:w-auto"
            >
              Okudum, Kabul Ediyorum
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KvkkText() {
  return (
    <div className="space-y-4">
      <p className="font-medium">Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni</p>

      <p>
        İşbu Aydınlatma Metni, EDUMATH (“Platform”) üzerinden sunulan online eğitim, koçluk ve online
        sınav hizmetleri kapsamında; 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca
        kişisel verilerinizin işlenmesine ilişkin olarak sizi bilgilendirmek amacıyla hazırlanmıştır.
      </p>

      <div className="space-y-2">
        <p className="font-medium">1) Veri Sorumlusu</p>
        <p>
          Bu metinde aksi belirtilmedikçe veri sorumlusu EDUMATH’tır. (Yayın öncesi: firma unvanı,
          adres, e-posta, MERSİS vb. bilgileri buraya ekleyin.)
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">2) İşlenen Kişisel Veri Kategorileri</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kimlik/İletişim: ad, soyad, e-posta, (opsiyonel) telefon</li>
          <li>Hesap/İşlem: giriş-çıkış kayıtları, oturum bilgileri, güvenlik kayıtları</li>
          <li>Eğitim/İçerik: ders, sınav, ilerleme ve performans verileri (platform kullanımına göre)</li>
          <li>Teknik: cihaz/oturum bilgileri, IP, tarayıcı bilgisi (güvenlik ve performans için)</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-medium">3) Amaçlar</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Hesap oluşturma, kimlik doğrulama ve güvenli oturum yönetimi</li>
          <li>Koçluk/eğitim hizmetlerinin sunulması, planlanması ve yürütülmesi</li>
          <li>Online sınavların uygulanması ve sonuçların raporlanması</li>
          <li>Hizmet kalitesi, performans, hata ayıklama ve güvenlik</li>
          <li>Talep/şikayet yönetimi ve kullanıcı desteği</li>
          <li>Mevzuattan doğan yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-medium">4) Hukuki Sebepler</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sözleşmenin kurulması/ifası (KVKK m.5/2-c)</li>
          <li>Hukuki yükümlülük (KVKK m.5/2-ç)</li>
          <li>Meşru menfaat (KVKK m.5/2-f) (güvenlik, sistem sürekliliği)</li>
          <li>Açık rıza (gereken hallerde) (KVKK m.5/1)</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-medium">5) Aktarım</p>
        <p>
          Kişisel verileriniz, hizmetin sunulması için gerekli olması halinde; altyapı/hosting,
          e-posta, SMS, analiz, müşteri destek araçları gibi üçüncü taraf hizmet sağlayıcılarla
          sınırlı ve ölçülü olarak paylaşılabilir. Yurt dışına aktarım söz konusu ise KVKK’ya uygun
          şekilde gerekli taahhüt/izin süreçleri işletilir.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">6) Saklama Süresi</p>
        <p>
          Verileriniz, ilgili mevzuatta öngörülen veya işleme amacının gerektirdiği süre boyunca
          saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">7) Haklarınız (KVKK m.11)</p>
        <p>
          KVKK’nın 11. maddesi kapsamındaki haklarınıza ilişkin taleplerinizi, platform üzerindeki
          iletişim kanalları aracılığıyla iletebilirsiniz.
        </p>
      </div>
    </div>
  )
}

function AcikRizaText() {
  return (
    <div className="space-y-4">
      <p className="font-medium">Açık Rıza Metni</p>

      <p>
        EDUMATH platformu kapsamında; aşağıdaki hususlarda açık rıza vermeniz gereken durumlarda
        (ör. tanıtım/iletişim, yurt dışı aktarım vb.) rızanız bu metinle alınır.
      </p>

      <div className="space-y-2">
        <p className="font-medium">1) İletişim (Tanıtım/Bilgilendirme)</p>
        <p>
          Kampanya, duyuru ve hizmet bilgilendirmelerinin e-posta/SMS/telefon kanallarıyla tarafıma
          iletilmesine açık rıza veriyorum.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">2) Yurt Dışı Aktarım</p>
        <p>
          Platformun teknik altyapısı kapsamında, hizmet sağlayıcıların yurt dışında bulunması
          halinde kişisel verilerimin yurt dışına aktarılmasına açık rıza veriyorum.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">3) Açık Rızanın Geri Alınması</p>
        <p>
          Açık rızamı dilediğim zaman geri çekebileceğimi, geri çekmenin geçmişe etkili olmayacağını
          ve rıza gerektirmeyen işleme faaliyetlerini etkilemeyeceğini biliyorum.
        </p>
      </div>
    </div>
  )
}
