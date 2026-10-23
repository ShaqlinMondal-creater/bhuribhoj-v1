import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type MenuRow = {
  id: number;
  menu_date: string;
  meal_type: "lunch" | "dinner";
  dishes: string;
};

export const menuService = {
  fetch(role: Role) {
    return apiClient<{ data: MenuRow[] }>(`${doorFor(role)}/daily-menus/fetch`, { method: "POST", body: {} });
  },
  save(role: Role, body: { menu_date: string; meal_type: "lunch" | "dinner"; dishes: string }) {
    return apiClient<{ message: string }>(`${doorFor(role)}/daily-menus/create`, { method: "POST", body });
  },
};
