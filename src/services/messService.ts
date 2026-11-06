import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import { messQuery, withMessId } from "@/lib/adminMess";
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
  guest_meal_setups?: GuestMealSetup[];
  president_user?: { id: number; name: string; email: string; role: string } | null;
  manager_user?: { id: number; name: string; email: string; role: string } | null;
};

export type MessLeader = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AdminMess = MessRecord & {
  monthly_due_amount?: string | number;
  monthly_due_days?: number | null;
  late_fee_amount?: string | number;
  s_deposite_amount?: string | number | null;
  president_user?: MessLeader | null;
  manager_user?: MessLeader | null;
  guest_meal_setups?: GuestMealSetup[];
  active_subscription?: HouseSubscription | null;
};

export type AdminMessPage = {
  data: AdminMess[];
  count: number;
  limit: number;
  offset: number;
};

export const messService = {
  fetch(query: { limit?: number; offset?: number } = {}) {
    return apiClient<AdminMessPage | { data?: MessRecord[] } | MessRecord>("/admin/messes/fetch", {
      method: "POST",
      body: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    });
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
  adminOpen(body: MessWrite & { president_user_id?: number | null }) {
    return apiClient<{ message: string; data: AdminMess }>("/admin/messes/open", { method: "POST", body });
  },
  adminUpdate(messId: number, body: Partial<MessWrite> & { is_active?: boolean }) {
    return apiClient<{ message: string; data: House }>("/admin/messes/update", {
      method: "POST",
      body: withMessId({ ...body }, messId),
    });
  },
  adminAssign(
    messId: number,
    body: { user_id: number; seat: "president" | "manager"; from_date: string; to_date?: string | null },
  ) {
    return apiClient<{ message: string; data: AdminMess }>("/admin/messes/assign", {
      method: "POST",
      body: withMessId({ ...body }, messId),
    });
  },
  adminRemove(messId: number) {
    return apiClient<{ message: string }>(`/admin/messes/${messId}/delete${messQuery(messId)}`, {
      method: "DELETE",
      body: withMessId({}, messId),
    });
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
  adminGuestMeals(messId: number) {
    return apiClient<{ data: GuestMealSetup[] }>("/admin/guest-meal-setup/fetch", {
      method: "POST",
      body: withMessId({}, messId),
    });
  },
  adminSaveGuestMeal(messId: number, body: { id?: number; meal_name: string; price: number }) {
    if (body.id) {
      return apiClient<{ message: string; data: GuestMealSetup }>("/admin/guest-meal-setup/update", {
        method: "POST",
        body: withMessId({ ...body }, messId),
      });
    }
    return apiClient<{ message: string; data: GuestMealSetup }>("/admin/guest-meal-setup/create", {
      method: "POST",
      body: withMessId({ ...body }, messId),
    });
  },
  adminRemoveGuestMeal(messId: number, id: number) {
    return apiClient<{ message: string }>(`/admin/guest-meal-setup/${id}/delete${messQuery(messId)}`, {
      method: "DELETE",
      body: withMessId({}, messId),
    });
  },
};
