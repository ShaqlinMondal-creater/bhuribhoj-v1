import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";
import type { MealSlot } from "@/services/mealService";

export type MenuRow = {
  id: number;
  menu_date: string;
  meal_type: MealSlot;
  dishes: string;
  decider?: { id: number; name: string } | null;
};

export type MenuQuery = {
  search?: string;
  meal_type?: MealSlot;
  from_date?: string;
  to_date?: string;
};

export const menuService = {
  fetch(role: Role, query: MenuQuery = {}) {
    const body: MenuQuery = {};
    if (query.search) body.search = query.search;
    if (query.meal_type) body.meal_type = query.meal_type;
    if (query.from_date) body.from_date = query.from_date;
    if (query.to_date) body.to_date = query.to_date;
    return apiClient<{ data: MenuRow[] }>(`${doorFor(role)}/daily-menus/fetch`, { method: "POST", body });
  },
  save(role: Role, body: { menu_date: string; meal_type: MealSlot; dishes: string }) {
    return apiClient<{ message: string }>(`${doorFor(role)}/daily-menus/create`, { method: "POST", body });
  },
  remove(role: Role, id: number) {
    return apiClient<{ message: string }>(`${doorFor(role)}/daily-menus/${id}/delete`, { method: "DELETE" });
  },
};
