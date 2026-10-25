import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type MealSlot = "breakfast" | "morning_snack" | "lunch" | "evening_snack" | "dinner" | "late_night";

export const mealOrder: MealSlot[] = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "late_night"];

export const mealCatalog: {
  type: MealSlot;
  label: string;
  hours: string;
  lock: string;
  hour: number;
  minute: number;
  tone: "amber" | "green" | "sky" | "rose";
}[] = [
  { type: "breakfast", label: "Breakfast", hours: "6:00 – 9:00", lock: "6:00 AM", hour: 6, minute: 0, tone: "amber" },
  { type: "morning_snack", label: "Morning Snack", hours: "10:00 – 11:30", lock: "10:00 AM", hour: 10, minute: 0, tone: "green" },
  { type: "lunch", label: "Lunch", hours: "12:30 – 3:00", lock: "12:30 PM", hour: 12, minute: 30, tone: "green" },
  { type: "evening_snack", label: "Evening Snack", hours: "5:30 – 7:30", lock: "5:30 PM", hour: 17, minute: 30, tone: "sky" },
  { type: "dinner", label: "Dinner", hours: "9:00 – 11:30", lock: "9:00 PM", hour: 21, minute: 0, tone: "sky" },
  { type: "late_night", label: "Late-Night Snack", hours: "12:00 – 2:00", lock: "12:00 AM", hour: 24, minute: 0, tone: "rose" },
];

export function mealInfo(slot: MealSlot) {
  return mealCatalog.find((meal) => meal.type === slot) ?? mealCatalog[2];
}

export function servedMealSlots(rows: MessMeal[]): MealSlot[] {
  if (rows.length === 0) return ["lunch", "dinner"];
  return mealOrder.filter((slot) => rows.some((row) => row.meals_type === slot && row.status === "active"));
}

export function mealIsOn(rows: MessMeal[], slot: MealSlot) {
  if (rows.length === 0) return slot === "lunch" || slot === "dinner";
  return rows.some((row) => row.meals_type === slot && row.status === "active");
}

export type MessMeal = {
  id: number;
  mess_id: number;
  meals_type: MealSlot;
  added_by: number | null;
  status: "active" | "inactive";
};

export type MealRow = {
  id: number;
  breakfast_active?: boolean;
  breakfast_taken?: boolean;
  morning_snack_active?: boolean;
  morning_snack_taken?: boolean;
  lunch_active: boolean;
  lunch_taken: boolean;
  evening_snack_active?: boolean;
  evening_snack_taken?: boolean;
  dinner_active: boolean;
  dinner_taken: boolean;
  late_night_active?: boolean;
  late_night_taken?: boolean;
  away?: boolean;
  user?: { id: number; name: string; member_code?: string | null; room_no?: string | null } | null;
};

export type MealsPayload = {
  meal_date: string;
  meals?: MealSlot[];
  summary: {
    breakfast_active?: number;
    breakfast_taken?: number;
    lunch_active: number;
    lunch_taken: number;
    dinner_active: number;
    dinner_taken: number;
  };
  data: MealRow[];
};

export type MealAway = {
  id: number;
  user_id: number;
  from_date: string;
  from_meal: MealSlot;
  to_date: string | null;
  to_meal: MealSlot | null;
  note?: string | null;
  user?: { id: number; name: string; member_code?: string | null } | null;
};

export type MealAwayInput = {
  id?: number;
  user_id: number;
  from_date: string;
  from_meal: MealSlot;
  to_date?: string | null;
  to_meal?: MealSlot | null;
  note?: string;
};

export const mealService = {
  fetch(role: Role, mealDate?: string) {
    return apiClient<MealsPayload>(`${doorFor(role)}/daily-meals/fetch`, {
      method: "POST",
      body: mealDate ? { meal_date: mealDate } : {},
    });
  },
  aways(role: Role) {
    return apiClient<{ data: MealAway[] }>(`${doorFor(role)}/meal-aways/fetch`, { method: "POST", body: {} });
  },
  saveAway(role: Role, body: MealAwayInput) {
    return apiClient<{ message: string }>(`${doorFor(role)}/meal-aways/save`, { method: "POST", body });
  },
  removeAway(role: Role, id: number) {
    return apiClient<{ message: string }>(`${doorFor(role)}/meal-aways/${id}/delete`, { method: "DELETE" });
  },
  messMeals(role: Role) {
    return apiClient<{ data: MessMeal[] }>(`${doorFor(role)}/mess-meals/fetch`, { method: "POST", body: {} });
  },
  saveMessMeal(role: Role, body: { meals_type: MealSlot; status: "active" | "inactive" }) {
    return apiClient<{ message: string }>(`${doorFor(role)}/mess-meals/save`, { method: "POST", body });
  },
};
