import { apiClient } from "@/lib/api/client";
import type { AccountSeat, Plan } from "@/types/auth";

export type RazorpayOrder = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  plan: Plan;
};

export type PlanInput = {
  name: string;
  duration_months: number;
  price_inr: number;
  is_active?: boolean;
};

export const planService = {
  fetch() {
    return apiClient<{ data: Plan[] }>("/public/plans/fetch", {
      method: "POST",
      body: {},
      auth: false,
    });
  },
  create(body: PlanInput) {
    return apiClient<{ message: string; data: Plan }>("/admin/plans/create", { method: "POST", body });
  },
  update(body: PlanInput & { id: number }) {
    return apiClient<{ message: string; data: Plan }>("/admin/plans/update", { method: "POST", body });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/plans/${id}/delete`, { method: "DELETE" });
  },
  order(planId: number) {
    return apiClient<RazorpayOrder>("/president/subscriptions/order", {
      method: "POST",
      body: { plan_id: planId },
    });
  },
  fail(body: { razorpay_order_id: string; razorpay_payment_id?: string; failure_reason?: string }) {
    return apiClient<{ message: string }>("/president/subscriptions/fail", {
      method: "POST",
      body,
    });
  },
  verify(body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return apiClient<{ message: string; seat: AccountSeat }>("/president/subscriptions/verify", {
      method: "POST",
      body,
    });
  },
};
