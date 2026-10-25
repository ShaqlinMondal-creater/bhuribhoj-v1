import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { FundType, MessRecord } from "@/lib/api/mess";
import type { AccountSeat, Plan, Role } from "@/types/auth";

export type House = MessRecord & {
  monthly_due_amount: string | number;
  monthly_due_days: number | null;
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
  monthly_due_days: number | null;
  s_deposite_amount: number | null;
  late_fee_amount: number;
};

export type GuestMealSetup = {
  id: number;
  meal_name: string;
  price: string | number;
};

export type HouseSubscription = {
  id: number;
  plan_id: number;
  starts_on: string | null;
  ends_on: string | null;
  status: string;
  amount_paid_inr: number;
  plan?: Pick<Plan, "id" | "name" | "duration_months" | "price_inr"> | null;
};

export type HousePayload = House & {
  active_subscription?: HouseSubscription | null;
};

export const messService = {
  fetch() {
    return apiClient<{ data?: MessRecord[] } | MessRecord>("/admin/messes/fetch", { method: "POST", body: {} });
  },
  house(role: Role) {
    return apiClient<{ data: HousePayload | null }>(`${doorFor(role)}/messes/fetch`, { method: "POST", body: {} });
  },
  update(body: Partial<MessWrite>) {
    return apiClient<{ message: string; data: House }>("/president/messes/update", { method: "POST", body });
  },
  open(body: MessWrite) {
    return apiClient<{ message: string; seat: AccountSeat }>("/president/messes/open", { method: "POST", body });
  },
  guestMeals() {
    return apiClient<{ data: GuestMealSetup[] }>("/president/guest-meal-setup/fetch", { method: "POST", body: {} });
  },
  saveGuestMeal(body: { id?: number; meal_name: string; price: number }) {
    if (body.id) {
      return apiClient<{ message: string; data: GuestMealSetup }>("/president/guest-meal-setup/update", { method: "POST", body });
    }
    return apiClient<{ message: string; data: GuestMealSetup }>("/president/guest-meal-setup/create", { method: "POST", body });
  },
  removeGuestMeal(id: number) {
    return apiClient<{ message: string }>(`/president/guest-meal-setup/${id}/delete`, { method: "DELETE" });
  },
};
