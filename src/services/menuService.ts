import { apiClient } from "@/lib/api/client";

export type MenuRow = {
  id: number;
  menu_date: string;
  meal_type: "lunch" | "dinner";
  dishes: string;
};

export const menuService = {
  fetch() {
    return apiClient<{ data: MenuRow[] }>("/daily-menus/fetch", { method: "POST", body: {} });
  },
  save(body: { menu_date: string; meal_type: "lunch" | "dinner"; dishes: string }) {
    return apiClient<{ message: string }>("/daily-menus/create", { method: "POST", body });
  },
};
