import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Checkbox } from "@shared/ui/checkbox"
import { getTrPhoneValidationError } from "@shared/lib/phone"
import { trTitle } from "@shared/lib/tr-string"
import { useAuth } from "@app/providers/auth-provider"

const KVKK_CONSENT_KEY = "edumath:kvkk_consent"
const MIN_PASSWORD_LEN = 8

function readKvkkAccepted() {
  try {
    const raw = localStorage.getItem(KVKK_CONSENT_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    return data?.accepted === true
  } catch {
    return false
  }
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "")
}

function formatTrPhone(raw: string) {
  let d = onlyDigits(raw)
  if (d.length > 0 && d[0] !== "0") d = "0" + d
  d = d.slice(0, 11)

  const p0 = d.slice(0, 1)
  const p1 = d.slice(1, 4)
  const p2 = d.slice(4, 7)
  const p3 = d.slice(7, 9)
  const p4 = d.slice(9, 11)

  if (!p0) return ""

  let out = p0
  if (p1.length) out += `(${p1}`
  if (p1.length === 3) out += `)`
  if (p2.length) out += ` ${p2}`
  if (p3.length) out += ` ${p3}`
  if (p4.length) out += ` ${p4}`
  return out
}


function formatError(e: any) {
  const data = e?.response?.data

  if (typeof data === "string" && (data.includes("<") || data.toLowerCase().includes("html")))
    return "Veri yüklenemedi."

  if (typeof data?.detail === "string") return data.detail

  if (data && typeof data === "object") {
    const lines: string[] = []
    for (const [field, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        for (const msg of val) lines.push(`${field}: ${String(msg)}`)
      } else if (typeof val === "string") {
        lines.push(`${field}: ${val}`)
      } else {
        lines.push(`${field}: ${JSON.stringify(val)}`)
      }
    }
    if (lines.length) return lines.join("\n")
  }

  return e?.message ?? "Kayıt yapılamadı"
}

function normalize(s: string) {
  return (s ?? "").trim().toLowerCase()
}

function emailParts(email: string) {
  const e = normalize(email)
  const [local, domain] = e.split("@")
  return { local: local ?? "", domain: domain ?? "" }
}

function looksSimilar(password: string, needle: string) {
  const p = normalize(password)
  const n = normalize(needle)
  if (!n) return false
  if (n.length < 3) return false
  return p.includes(n)
}

type Rule = { ok: boolean; text: string }

function passwordRules(params: { password: string; email: string; firstName: string; lastName: string }): Rule[] {
  const { password, email, firstName, lastName } = params
  const p = password ?? ""
  const { local } = emailParts(email)

  const isAllDigits = p.length > 0 && /^\d+$/.test(p)
  const hasMinLen = p.length >= MIN_PASSWORD_LEN

  const similarToEmail = looksSimilar(p, email) || looksSimilar(p, local)
  const similarToName = looksSimilar(p, firstName) || looksSimilar(p, lastName)

  return [
    { ok: hasMinLen, text: `En az ${MIN_PASSWORD_LEN} karakter` },
    { ok: !isAllDigits, text: "Tamamen sayılardan oluşmamalı" },
    { ok: !similarToEmail, text: "E-posta adresine benzememeli / e-posta içermemeli" },
    { ok: !similarToName, text: "Ad / soyad içermemeli" },
    { ok: true, text: "Çok yaygın şifreler kabul edilmez (örn. 123456) — sistem kontrol eder" },
  ]
}

function RuleItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className={[
          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
          ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
        ].join(" ")}
      >
        {ok ? "✓" : "!"}
      </span>
      <div className={ok ? "text-emerald-700" : "text-red-700"}>{text}</div>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerTeacher } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")

  const [kvkkAccepted, setKvkkAccepted] = useState(false)

  // ✅ Accordion state
  const [showPwRules, setShowPwRules] = useState(false)

  useEffect(() => {
    setKvkkAccepted(readKvkkAccepted())
  }, [])

  useEffect(() => {
    const sync = () => setKvkkAccepted(readKvkkAccepted())
    window.addEventListener("focus", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.removeEventListener("focus", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rules = useMemo(
    () => passwordRules({ password, email, firstName, lastName }),
    [password, email, firstName, lastName]
  )

  const rulesOk = useMemo(() => rules.slice(0, 4).every((r) => r.ok), [rules])

  // ✅ password2 canlı durum (kullanıcı yazmaya başladıysa göster)
  const showConfirmState = password2.length > 0
  const confirmOk = showConfirmState ? password2 === password : false

  const canSubmit = useMemo(() => {
    if (submitting) return false
    if (!firstName || !lastName || !email || !password || !password2) return false
    if (!kvkkAccepted) return false
    if (phone && getTrPhoneValidationError(phone)) return false
    if (!rulesOk) return false
    if (password !== password2) return false
    return true
  }, [submitting, firstName, lastName, email, password, password2, kvkkAccepted, phone, rulesOk])

  // ✅ Disabled reason (tooltip)
  const disabledReason = useMemo(() => {
    if (submitting) return "İşlem sürüyor…"
    if (!firstName || !lastName || !email || !password || !password2) return "Zorunlu alanları doldurun"
    if (!kvkkAccepted) return "Devam etmek için KVKK onayı gerekli"
    const phoneErr = getTrPhoneValidationError(phone)
    if (phone && phoneErr) return phoneErr
    if (!rulesOk) return "Şifre kurallarını tamamlayın"
    if (password !== password2) return "Şifreler uyuşmuyor"
    return ""
  }, [submitting, firstName, lastName, email, password, password2, kvkkAccepted, phone, rulesOk])

  const onSubmit = async () => {
    setError(null)

    if (!firstName || !lastName || !email || !password || !password2) {
      setError("Lütfen zorunlu alanların tamamını doldurun.")
      return
    }
    if (!kvkkAccepted) {
      setError("Devam etmek için KVKK metnini onaylamalısın.")
      return
    }
    const phoneErr = phone ? getTrPhoneValidationError(phone) : null
    if (phoneErr) {
      setError(phoneErr)
      return
    }
    if (!rulesOk) {
      setShowPwRules(true) // ✅ kurallar eksikse otomatik aç
      setError("Şifre kurallarını sağlayan bir şifre belirlemelisin.")
      return
    }
    if (password !== password2) {
      setError("Şifreler birbiriyle uyuşmuyor.")
      return
    }

    setSubmitting(true)
    try {
      await registerTeacher({
        email: email.trim(),
        password,
        first_name: trTitle(firstName.trim()),
        last_name: trTitle(lastName.trim()),
      })
      navigate("/dashboard", { replace: true })
    } catch (e: any) {
      setError(formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hesap Oluştur</h1>
        <p className="mt-1 text-sm text-muted-foreground">EDUMATH koçluk sistemine hemen katıl.</p>
      </div>

      <div className="space-y-3">
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
                !
              </div>
              <div className="space-y-1">
                <div className="font-semibold">Kayıt başarısız</div>
                <div className="whitespace-pre-line">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Ad</div>
            <Input
              placeholder="Adınız"
              value={firstName}
              onChange={(e) => setFirstName(trTitle(e.target.value))}
              disabled={submitting}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Soyad</div>
            <Input
              placeholder="Soyadınız"
              value={lastName}
              onChange={(e) => setLastName(trTitle(e.target.value))}
              disabled={submitting}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">E-posta</div>
          <Input
            type="email"
            placeholder="ornek@edumath.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Telefon (opsiyonel)</div>
          <Input
            placeholder="0(5xx) xxx xx xx"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatTrPhone(e.target.value))}
            disabled={submitting}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Şifre</div>
          <Input
            type="password"
            placeholder="Bir şifre oluştur"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowPwRules(true)} // ✅ odakta aç
            disabled={submitting}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Şifre Tekrar</div>
          <Input
            type="password"
            placeholder="Şifreni tekrar gir"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
          />

          {showConfirmState && (
            <div
              className={[
                "rounded-md border p-3 text-sm",
                confirmOk
                  ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700"
                  : "border-red-600/40 bg-red-600/10 text-red-700",
              ].join(" ")}
            >
              <div className="flex items-start gap-2">
                <span
                  className={[
                    "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                    confirmOk ? "bg-emerald-600" : "bg-red-600",
                  ].join(" ")}
                >
                  {confirmOk ? "✓" : "!"}
                </span>
                <div className="font-medium">{confirmOk ? "Şifreler eşleşiyor" : "Şifreler uyuşmuyor"}</div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ Şifre kuralları: Şifre tekrarının altında + accordion */}
        <div className="mt-2 rounded-lg border border-border bg-card">
          <button
            type="button"
            onClick={() => setShowPwRules((s) => !s)}
            className="flex w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="text-sm font-semibold">Şifre kuralları</span>
            <span className="text-xs text-muted-foreground">{showPwRules ? "Gizle" : "Göster"}</span>
          </button>

          {showPwRules && (
            <div className="border-t border-border px-3 py-3">
              <div className="space-y-2">
                {rules.map((r, idx) => (
                  <RuleItem key={idx} ok={r.ok} text={r.text} />
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            className="mt-1 shrink-0"
            checked={kvkkAccepted}
            onCheckedChange={setKvkkAccepted}
            disabled={submitting}
          />
          <span>
            <Link to="/kvkk" className="text-primary hover:underline">
              KVKK Aydınlatma Metni
            </Link>{" "}
            ve{" "}
            <Link to="/kvkk" className="text-primary hover:underline">
              Açık Rıza
            </Link>{" "}
            metnini okudum, kabul ediyorum.
          </span>
        </label>

        {/* ✅ Tooltip için wrapper (disabled button hover çalışsın diye) */}
        <div className="relative">
          <div className="group">
            <Button className="w-full" onClick={onSubmit} disabled={!canSubmit}>
              {submitting ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
            </Button>

            {!canSubmit && !!disabledReason && (
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                {disabledReason}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Zaten hesabın var mı?{" "}
        <Link to="/auth/login" className="text-primary hover:underline">
          Giriş Yap
        </Link>
      </div>
    </div>
  )
}
