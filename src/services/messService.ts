import { apiClient } from "@/lib/api/client";
import type { MessRecord } from "@/lib/api/mess";
import type { AccountSeat } from "@/types/auth";

export type House = MessRecord & {
  monthly_due_amount: string | number;
  monthly_due_day: number;
  late_fee_amount: string | number;
  guest_chicken_price: string | number;
  guest_fish_price: string | number;
  guest_egg_price: string | number;
  guest_veg_price: string | number;
};

export const messService = {
  fetch() {
    return apiClient<{ data?: MessRecord[] } | MessRecord>("/messes/fetch", { method: "POST", body: {} });
  },
  house() {
    return apiClient<{ data: House }>("/messes/fetch", { method: "POST", body: {} });
  },
  update(body: Partial<House>) {
    return apiClient<{ message: string; data: House }>("/messes/update", { method: "POST", body });
  },
  open(body: {
    name: string;
    address: string;
    district: string;
    pincode: string;
    contact_no: string;
    email: string;
    fund_mode: "manager_only" | "mess_and_manager";
  }) {
    return apiClient<{ message: string; seat: AccountSeat }>("/messes/open", { method: "POST", body });
  },
};
