import { apiClient } from "@/lib/api/client";
import type { FundType, MessRecord } from "@/lib/api/mess";
import type { AccountSeat } from "@/types/auth";

export type House = MessRecord & {
  monthly_due_amount: string | number;
  monthly_due_date: string | null;
  late_fee_amount: string | number;
  s_deposite_amount: string | number | null;
};

export type MessWrite = {
  name: string;
  address: string;
  district: string;
  pincode: string;
  contact_no: string;
  email: string | null;
  fund_type: FundType;
  monthly_due_amount: number;
  monthly_due_date: string | null;
  s_deposite_amount: number | null;
  late_fee_amount: number;
};

export type GuestMealSetup = {
  id: number;
  meal_name: string;
  price: string | number;
};

export const messService = {
  fetch() {
    return apiClient<{ data?: MessRecord[] } | MessRecord>("/messes/fetch", { method: "POST", body: {} });
  },
  house() {
    return apiClient<{ data: House | null }>("/messes/fetch", { method: "POST", body: {} });
  },
  update(body: Partial<MessWrite>) {
    return apiClient<{ message: string; data: House }>("/messes/update", { method: "POST", body });
  },
  open(body: MessWrite) {
    return apiClient<{ message: string; seat: AccountSeat }>("/messes/open", { method: "POST", body });
  },
  guestMeals() {
    return apiClient<{ data: GuestMealSetup[] }>("/guest-meal-setup/fetch", { method: "POST", body: {} });
  },
  saveGuestMeal(body: { id?: number; meal_name: string; price: number }) {
    if (body.id) {
      return apiClient<{ message: string; data: GuestMealSetup }>("/guest-meal-setup/update", { method: "POST", body });
    }
    return apiClient<{ message: string; data: GuestMealSetup }>("/guest-meal-setup/create", { method: "POST", body });
  },
  removeGuestMeal(id: number) {
    return apiClient<{ message: string }>(`/guest-meal-setup/${id}/delete`, { method: "DELETE" });
  },
};
