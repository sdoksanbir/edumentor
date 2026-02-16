import { useState } from "react"
import { cn } from "@shared/utils/cn"
import { getAvatarSrc } from "@shared/lib/avatar"
import type { PanelUser } from "@features/admin/api/users-api"

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return "?"
}

type UserAvatarProps = {
  user: Pick<PanelUser, "role" | "gender">
  firstName: string
  lastName: string
  email: string
  className?: string
}

export function UserAvatar({
  user,
  firstName,
  lastName,
  email,
  className,
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const src = getAvatarSrc(user)
  const initials = getInitials(firstName, lastName, email)

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden relative",
        "bg-muted text-muted-foreground text-xs font-medium",
        className
      )}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
