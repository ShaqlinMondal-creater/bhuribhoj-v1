import { apiClient } from "@/lib/api/client";
import type { AccountSeat, Plan } from "@/types/auth";

export type RazorpayOrder = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  plan: Plan;
};

export const planService = {
  fetch() {
    return apiClient<{ data: Plan[] }>("/plans/fetch", { method: "POST", auth: false, body: {} });
  },
  order(planId: number) {
    return apiClient<RazorpayOrder>("/subscriptions/order", {
      method: "POST",
      body: { plan_id: planId },
    });
  },
  fail(body: { razorpay_order_id: string; razorpay_payment_id?: string; failure_reason?: string }) {
    return apiClient<{ message: string }>("/subscriptions/fail", {
      method: "POST",
      body,
    });
  },
  verify(body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return apiClient<{ message: string; seat: AccountSeat }>("/subscriptions/verify", {
      method: "POST",
      body,
    });
  },
};
