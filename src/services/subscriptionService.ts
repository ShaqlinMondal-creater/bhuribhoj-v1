import { apiClient } from "@/lib/api/client";

export type SubscriptionRow = {
  id: number;
  mess_id: number | null;
  status: string;
  purchase_source: string;
  starts_on: string | null;
  ends_on: string | null;
  amount_paid_inr: number | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string | null;
  mess: { id: number; name: string; code: string } | null;
  plan: { id: number; name: string; duration_months: number; price_inr: number } | null;
  purchaser: { id: number; name: string; email: string } | null;
};

export type SubscriptionQuery = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export const subscriptionService = {
  fetch(scope: "admin" | "president", query: SubscriptionQuery = {}) {
    const door = scope === "admin" ? "/admin" : "/president";
    return apiClient<{ data: SubscriptionRow[]; count?: number; limit?: number; offset?: number }>(
      `${door}/subscriptions/fetch`,
      { method: "POST", body: query },
    );
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/subscriptions/${id}/delete`, { method: "DELETE" });
  },
};
