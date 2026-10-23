import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type MealRow = {
  id: number;
  lunch_active: boolean;
  lunch_taken: boolean;
  dinner_active: boolean;
  dinner_taken: boolean;
  user?: { id: number; name: string; member_code?: string | null; room_no?: string | null } | null;
};

export type MealsPayload = {
  meal_date: string;
  summary: {
    lunch_active: number;
    lunch_taken: number;
    dinner_active: number;
    dinner_taken: number;
  };
  data: MealRow[];
};

export const mealService = {
  fetch(role: Role, mealDate?: string) {
    return apiClient<MealsPayload>(`${doorFor(role)}/daily-meals/fetch`, {
      method: "POST",
      body: mealDate ? { meal_date: mealDate } : {},
    });
  },
};
