import { apiClient } from "@/lib/api/client";

export type CouponRow = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount_inr: number | null;
  min_order_inr: number | null;
  starts_on: string | null;
  ends_on: string | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number | null;
  is_active: boolean;
  note: string | null;
  created_by: number | null;
  creator?: { id: number; name: string } | null;
};

export type CouponQuery = {
  search?: string;
  status?: string;
  limit: number;
  offset: number;
};

export type CouponWrite = {
  id?: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount_inr?: number | null;
  min_order_inr?: number | null;
  starts_on?: string | null;
  ends_on?: string | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  is_active?: boolean;
  note?: string | null;
};

export const couponService = {
  fetch(query: CouponQuery) {
    return apiClient<{ data: CouponRow[]; count: number; limit: number; offset: number }>("/admin/coupons/fetch", {
      method: "POST",
      body: query,
    });
  },
  create(body: CouponWrite) {
    return apiClient<{ message: string; data: CouponRow }>("/admin/coupons/create", { method: "POST", body });
  },
  update(body: CouponWrite & { id: number }) {
    return apiClient<{ message: string; data: CouponRow }>("/admin/coupons/update", { method: "POST", body });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/coupons/${id}/delete`, { method: "DELETE" });
  },
};
