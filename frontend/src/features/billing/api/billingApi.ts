import { apiClient } from "@shared/api/client"
import type {
  PlanApi,
  SubscriptionApi,
  TeacherSubscriptionInfo,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
  CreatePlanPayload,
  UpdatePlanPayload,
} from "../types"

export const billingKeys = {
  all: ["billing"] as const,
  plans: (params?: Record<string, string>) =>
    [...billingKeys.all, "plans", params ?? {}] as const,
  planDetail: (id: number) => [...billingKeys.all, "plans", id] as const,
  subscriptions: (params?: Record<string, string>) =>
    [...billingKeys.all, "subscriptions", params ?? {}] as const,
  subscriptionDetail: (id: number) => [...billingKeys.all, "subscriptions", id] as const,
  teacherSubscription: (teacherProfileId: number) =>
    [...billingKeys.all, "teacher", teacherProfileId, "subscription"] as const,
  mySubscription: () => [...billingKeys.all, "me", "subscription"] as const,
}

/** Admin: Plan list */
export async function listPlans(params?: {
  search?: string
  is_active?: string
}): Promise<PlanApi[]> {
  const res = await apiClient.get<PlanApi[]>("/admin/billing/plans/", { params })
  return res.data
}

/** Admin: Plan detail */
export async function getPlan(id: number): Promise<PlanApi> {
  const res = await apiClient.get<PlanApi>(`/admin/billing/plans/${id}/`)
  return res.data
}

/** Admin: Create plan */
export async function createPlan(data: CreatePlanPayload): Promise<PlanApi> {
  const res = await apiClient.post<PlanApi>("/admin/billing/plans/", data)
  return res.data
}

/** Admin: Update plan */
export async function updatePlan(id: number, data: UpdatePlanPayload): Promise<PlanApi> {
  const res = await apiClient.patch<PlanApi>(`/admin/billing/plans/${id}/`, data)
  return res.data
}

/** Admin: Delete plan (soft: is_active=false) */
export async function deletePlan(id: number): Promise<void> {
  await apiClient.delete(`/admin/billing/plans/${id}/`)
}

/** Admin: Subscription list */
export async function listSubscriptions(params?: {
  status?: string
  plan?: string
  teacher?: string
  expiring_soon?: string
  billing_period?: string
}): Promise<SubscriptionApi[]> {
  const res = await apiClient.get<SubscriptionApi[]>("/admin/billing/subscriptions/", {
    params,
  })
  return res.data
}

/** Admin: Subscription detail */
export async function getSubscription(id: number): Promise<SubscriptionApi> {
  const res = await apiClient.get<SubscriptionApi>(`/admin/billing/subscriptions/${id}/`)
  return res.data
}

/** Admin: Create subscription */
export async function createSubscription(
  data: CreateSubscriptionPayload
): Promise<SubscriptionApi> {
  const res = await apiClient.post<SubscriptionApi>(
    "/admin/billing/subscriptions/",
    data
  )
  return res.data
}

/** Admin: Update subscription */
export async function updateSubscription(
  id: number,
  data: UpdateSubscriptionPayload
): Promise<SubscriptionApi> {
  const res = await apiClient.patch<SubscriptionApi>(
    `/admin/billing/subscriptions/${id}/`,
    data
  )
  return res.data
}

/** Admin: Cancel subscription */
export async function cancelSubscription(id: number): Promise<SubscriptionApi> {
  const res = await apiClient.post<SubscriptionApi>(
    `/admin/billing/subscriptions/${id}/cancel/`
  )
  return res.data
}

/** Admin: Renew subscription */
export async function renewSubscription(id: number): Promise<SubscriptionApi> {
  const res = await apiClient.post<SubscriptionApi>(
    `/admin/billing/subscriptions/${id}/renew/`
  )
  return res.data
}

/** Admin: Change subscription plan */
export async function changeSubscriptionPlan(
  subscriptionId: number,
  payload: {
    plan_id: number
    billing_period?: "MONTHLY" | "YEARLY"
    effective?: "IMMEDIATE" | "NEXT_PERIOD"
    keep_period?: boolean
  }
): Promise<SubscriptionApi> {
  const res = await apiClient.post<SubscriptionApi>(
    `/admin/billing/subscriptions/${subscriptionId}/change-plan/`,
    payload
  )
  return res.data
}

/** Admin: Reactivate canceled/expired subscription */
export async function reactivateSubscription(
  id: number,
  extendDays?: number
): Promise<SubscriptionApi> {
  const res = await apiClient.post<SubscriptionApi>(
    `/admin/billing/subscriptions/${id}/reactivate/`,
    extendDays != null ? { extend_days: extendDays } : undefined
  )
  return res.data
}

/** Admin: Get teacher subscription (for assignment UI) */
export async function getTeacherSubscription(
  teacherProfileId: number
): Promise<TeacherSubscriptionInfo> {
  const res = await apiClient.get<TeacherSubscriptionInfo>(
    `/admin/billing/teachers/${teacherProfileId}/subscription/`
  )
  return res.data
}

/** Teacher: Own subscription */
export async function getMySubscription(): Promise<TeacherSubscriptionInfo> {
  const res = await apiClient.get<TeacherSubscriptionInfo>("/billing/me/subscription/")
  return res.data
}
