export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED"

export type MeUser = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  gender?: Gender
  profile_completed?: boolean
  role?: string
  is_staff?: boolean
  is_superuser?: boolean
  is_approved?: boolean
  must_change_password?: boolean
  is_active?: boolean
  created_at?: string
  last_login?: string
  approved_at_iso?: string | null
  approved_by_id?: number | null
  approved_by_email?: string | null
  avatar_url?: string | null
}

export type AuthEventItem = {
  id: number
  created_at: string | null
  event_type: "LOGIN_SUCCESS" | "LOGIN_FAIL" | "LOGOUT" | "REFRESH"
  ip_address: string
  user_agent: string
  meta: Record<string, unknown>
}

export type MeEventsResponse = {
  items: AuthEventItem[]
  total: number
  page: number
  page_size: number
}

export type MeUpdatePayload = {
  first_name?: string
  last_name?: string
  phone?: string
  gender?: Gender
}

export type ChangePasswordPayload = {
  old_password: string
  new_password: string
}
