// Billing types - snake_case from API

export type BillingPeriod = "MONTHLY" | "YEARLY"

export type PlanApi = {
  id: number
  code: string
  name: string
  student_limit: number
  price_monthly: string
  price_yearly: string
  currency: string
  is_active: boolean
  trial_days?: number
  yearly_savings?: string
  yearly_discount_percent?: string
  features?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELED"

export type SubscriptionTeacherApi = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
}

export type SubscriptionPlanApi = {
  id: number
  code: string
  name: string
  student_limit: number
  price_monthly?: string
  price_yearly?: string
  currency?: string
  yearly_savings?: string
  yearly_discount_percent?: string
}

export type SubscriptionApi = {
  id: number
  teacher: SubscriptionTeacherApi
  plan: SubscriptionPlanApi
  status: SubscriptionStatus
  billing_period?: BillingPeriod
  amount?: string
  currency?: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_end: string | null
  student_limit_snapshot: number
  assigned_students_count: number
  remaining_slots: number
  period_days_remaining?: number
  created_at?: string
  updated_at?: string
}

export type TeacherSubscriptionInfo = {
  subscription: {
    id: number
    plan: {
      id: number
      code: string
      name: string
      student_limit: number
      price_monthly?: string
      price_yearly?: string
      currency?: string
      yearly_savings?: string
      yearly_discount_percent?: string
    }
    status: SubscriptionStatus
    billing_period?: BillingPeriod
    amount?: string
    currency?: string
    current_period_start?: string
    current_period_end?: string
    trial_end?: string | null
    student_limit_snapshot: number
  } | null
  assigned_students_count: number
  remaining_slots: number
  limit: number
  period_days_remaining?: number
  next_renewal_at?: string | null
  message?: string | null
}

export type CreateSubscriptionPayload = {
  teacher_profile_id: number
  plan_id: number
  billing_period?: BillingPeriod
  start_now?: boolean
  trial_days?: number | null
}

export type UpdateSubscriptionPayload = {
  plan_id?: number
  extend_days?: number
  cancel_at_period_end?: boolean
}

export type CreatePlanPayload = {
  code: string
  name: string
  student_limit: number
  price_monthly: number
  price_yearly: number
  currency?: string
  is_active?: boolean
  trial_days?: number
  features?: Record<string, unknown> | null
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>

export type ChangePlanPayload = {
  plan_id: number
  billing_period?: BillingPeriod
  effective?: "IMMEDIATE" | "NEXT_PERIOD"
  keep_period?: boolean
}
