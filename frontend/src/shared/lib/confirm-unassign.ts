// src/shared/lib/confirm-unassign.ts - Premium unassign students confirmation
import Swal from "sweetalert2"

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

/**
 * Premium confirmation modal for unassigning students from a teacher.
 * Returns true only if the user confirms.
 */
export async function confirmUnassign(count: number): Promise<boolean> {
  const dark = isDarkMode()
  const result = await Swal.fire({
    title: "Atamayı Kaldır",
    html: `<p class="swal-unassign-message">Seçilen ${count} öğrencinin bu öğretmenle olan ataması kaldırılacak. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?</p>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Evet, Kaldır",
    cancelButtonText: "İptal",
    reverseButtons: true,
    buttonsStyling: false,
    width: 420,
    padding: "24px",
    background: dark ? "#0f172a" : "#ffffff",
    color: dark ? "#f1f5f9" : "#0f172a",
    customClass: {
      popup: "swal-unassign-popup",
      title: "swal-unassign-title",
      htmlContainer: "swal-unassign-html",
      actions: "swal-unassign-actions",
      confirmButton: "swal-unassign-confirm",
      cancelButton: "swal-unassign-cancel",
    },
    focusCancel: true,
  })
  return result.isConfirmed === true
}
