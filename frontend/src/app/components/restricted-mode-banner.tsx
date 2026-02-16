// src/app/components/restricted-mode-banner.tsx
// Onaysız kullanıcılar için "Kısıtlı Mod" banner
import { useAuth } from "@app/providers/auth-provider"

export function RestrictedModeBanner() {
  const { user } = useAuth()

  if (!user) return null
  if (user.role === "ADMIN" || user.is_staff || user.is_superuser) return null
  if (user.is_approved !== false) return null

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-300">
      <span className="font-medium">Kısıtlı Mod:</span>{" "}
      Hesabınız onay bekliyor. Onaylanana kadar işlem yapamazsınız.
    </div>
  )
}
