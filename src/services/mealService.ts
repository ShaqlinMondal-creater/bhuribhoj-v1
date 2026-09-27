import meals from "@/data/json/meals.json";
import { hasFullAccess } from "@/auth/authConfig";
import { makeId, nowIso, readCollection, STORAGE_KEYS, writeCollection } from "@/lib/prototypeStorage";
import type { Meal } from "@/types/meal";
import type { Role } from "@/types/user";

const seed = meals as Meal[];
export const getMeals = (): Meal[] => readCollection(STORAGE_KEYS.meals, seed);

const assertCanChange = (role: Role, actorMemberId: string | undefined, memberId: string) => {
	void actorMemberId;
	void memberId;
	if (!hasFullAccess(role)) throw new Error("Member accounts are view-only.");
};

export const addMeal = (input: Omit<Meal, "id" | "createdAt" | "updatedAt">, role: Role, actorMemberId?: string) => {
	assertCanChange(role, actorMemberId, input.memberId);
	const current = getMeals();
	if (current.some((meal) => meal.memberId === input.memberId && meal.date === input.date && meal.mealType === input.mealType && meal.status === "taken")) throw new Error("This meal is already recorded.");
	const timestamp = nowIso();
	const meal = { ...input, id: makeId("MEAL", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	writeCollection(STORAGE_KEYS.meals, [...current, meal]);
	return meal;
};

export const cancelMeal = (id: string, role: Role, actorMemberId?: string) => {
	const current = getMeals();
	const target = current.find((meal) => meal.id === id);
	if (!target) return null;
	assertCanChange(role, actorMemberId, target.memberId);
	const updated = current.map((meal) => meal.id === id ? { ...meal, status: "cancelled" as const, updatedAt: nowIso() } : meal);
	writeCollection(STORAGE_KEYS.meals, updated);
	return updated.find((meal) => meal.id === id) ?? null;
};