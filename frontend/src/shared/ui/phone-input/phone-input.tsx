import * as React from "react"
import { InputMask, type Track } from "@react-input/mask"
import { cn } from "@shared/utils/cn"

/**
 * Mask: 0( sabit prefix. Kullanıcı sadece 5 dahil 10 rakam girer (5xx xxx xx xx).
 * Fazla veya eksik rakam kabul edilmez.
 */
const TR_PHONE_MASK = "0(___) ___ __ __"

const track: Track = ({ inputType, data }) => {
  if (inputType !== "insert" || !data) return
  const digits = data.replace(/\D/g, "")
  if (digits.length === 0) return false
  let d = digits.startsWith("0") ? digits.slice(1) : digits
  if (d.length > 10) d = d.slice(0, 10)
  return d.length > 0 ? d : false
}

export type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: boolean
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, value = "", onChange, placeholder, id, ...props }, ref) => {
    const inputClassName = cn(
      "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm",
      "border transition-colors outline-none",
      "text-foreground placeholder:text-muted-foreground",
      error
        ? "border-red-500 focus:border-red-500"
        : "border-border focus:border-ring",
      className
    )
    return (
      <InputMask
        ref={ref}
        mask={TR_PHONE_MASK}
        replacement={{ _: /\d/ }}
        showMask
        track={track}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? "0(5xx) xxx xx xx"}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        className={inputClassName}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = "PhoneInput"
