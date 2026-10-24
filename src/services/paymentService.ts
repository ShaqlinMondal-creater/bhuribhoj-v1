import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type PaymentRow = {
  id: number;
  amount_inr: number;
  status: "created" | "failed" | "paid" | string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  mess_subscription_id: number | null;
  created_at: string | null;
  user: { id: number; name: string; email: string } | null;
  plan: { id: number; name: string; duration_months: number; price_inr: number } | null;
};

export type PaymentQuery = {
  search?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
};

export const paymentService = {
  fetch(query: PaymentQuery = {}) {
    return apiClient<{ data: PaymentRow[]; count?: number; limit?: number; offset?: number }>("/admin/payments/fetch", {
      method: "POST",
      body: query,
    });
  },
  messBills(role: Role) {
    return apiClient<{ data: PaymentRow[] }>(`${doorFor(role)}/bills/fetch`, { method: "POST", body: {} });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/payments/${id}/delete`, { method: "DELETE" });
  },
};
