// src/shared/lib/swal.ts - SweetAlert2 helpers (premium light/dark theme)
import Swal from "sweetalert2"
import { toast } from "sonner"

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

function getBaseOptions() {
  const dark = isDarkMode()
  return {
    width: 420,
    padding: "24px",
    customClass: {
      popup: "swal2-popup-premium",
      title: "swal2-title-premium",
      htmlContainer: "swal2-html-premium",
      actions: "swal2-actions-premium",
      confirmButton: "swal2-confirm-premium",
      cancelButton: "swal2-cancel-premium",
    },
    background: dark ? "#0f172a" : "#ffffff",
    color: dark ? "#f1f5f9" : "#0f172a",
    confirmButtonColor: "#FF9B51",
    cancelButtonColor: dark ? "#64748b" : "#94a3b8",
    reverseButtons: true,
    showCancelButton: true,
    focusCancel: true,
  } as const
}

const BASE_OPTIONS = {
  width: 420,
  customClass: {
    popup: "rounded-xl",
  },
  background: "#1f2937",
  color: "#f9fafb",
  confirmButtonColor: "#FF9B51",
  cancelButtonColor: "#6b7280",
  reverseButtons: true,
  showCancelButton: true,
  focusCancel: true,
} as const

/** Şifre sıfırlama onayı - info/question ikon, "Geçici şifre oluştur" butonu */
export async function resetPasswordConfirm(options: {
  fullName: string
}): Promise<{ isConfirmed: boolean }> {
  const result = await Swal.fire({
    ...getBaseOptions(),
    title: `${options.fullName} için geçici şifre oluşturulsun mu?`,
    html: `<div class="swal-desc">Kullanıcı ilk girişte şifresini değiştirmek zorunda olacaktır.</div>`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Geçici şifre oluştur",
    cancelButtonText: "Vazgeç",
  })
  return { isConfirmed: result.isConfirmed }
}

/** Lucide CheckCircle SVG - custom success icon */
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="swal-check-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`

/** Geçici şifre oluşturuldu başarı modalı */
export async function resetPasswordSuccess(password: string): Promise<void> {
  const escaped = password.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  await Swal.fire({
    ...getBaseOptions(),
    title: "",
    html: `
      <div class="swal-head">
        <div class="swal-icon-ring">${CHECK_SVG}</div>
        <div class="swal-title">Geçici şifre oluşturuldu</div>
        <p class="swal-password-hint">Kullanıcıya bu şifreyi iletin. İlk girişte değiştirmesi zorunludur.</p>
      </div>
      <div class="swal-password-block">
        <code id="swal-generated-password" class="swal-password-code">${escaped}</code>
        <button type="button" id="swal-copy-btn" class="swal-copy-btn">Kopyala</button>
      </div>
    `,
    icon: undefined,
    showCancelButton: false,
    confirmButtonText: "Kapat",
    didOpen: () => {
      const btn = document.getElementById("swal-copy-btn")
      const code = document.getElementById("swal-generated-password")
      if (btn && code) {
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(code.textContent || "")
          toast.success("Kopyalandı")
        })
      }
    },
  })
}

export async function confirmDelete(
  title: string,
  text?: string
): Promise<{ isConfirmed: boolean }> {
  const result = await Swal.fire({
    ...BASE_OPTIONS,
    title,
    text: text ?? "Bu işlem geri alınamaz.",
    icon: "warning",
    confirmButtonText: "Evet, Sil",
    cancelButtonText: "İptal",
  })
  return { isConfirmed: result.isConfirmed }
}

export async function confirmBulkDelete(
  count: number,
  options?: { title?: string; entityLabel?: string }
): Promise<{ isConfirmed: boolean }> {
  const title = options?.title ?? "Seçilen kayıtlar silinsin mi?"
  const text = `Bu işlem geri alınamaz. (${count} kayıt)`
  const result = await Swal.fire({
    ...BASE_OPTIONS,
    title,
    text,
    icon: "warning",
    confirmButtonText: "Evet, sil",
    cancelButtonText: "Vazgeç",
  })
  return { isConfirmed: result.isConfirmed }
}

export async function confirmAction(
  title: string,
  text?: string,
  confirmText?: string
): Promise<{ isConfirmed: boolean }> {
  const result = await Swal.fire({
    ...BASE_OPTIONS,
    title,
    text,
    icon: "question",
    confirmButtonText: confirmText ?? "Evet",
    cancelButtonText: "İptal",
  })
  return { isConfirmed: result.isConfirmed }
}

export async function successAlert(title: string, text?: string): Promise<void> {
  await Swal.fire({
    ...BASE_OPTIONS,
    title,
    text,
    icon: "success",
    showCancelButton: false,
    confirmButtonText: "Tamam",
  })
}

export async function errorAlert(title: string, text?: string): Promise<void> {
  await Swal.fire({
    ...BASE_OPTIONS,
    title,
    text,
    icon: "error",
    showCancelButton: false,
    confirmButtonText: "Tamam",
  })
}
