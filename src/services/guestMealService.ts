import guestMeals from "@/data/json/guestMeals.json";
import { hasFullAccess } from "@/auth/authConfig";
import { getSettings } from "@/services/messService";
import { makeId, nowIso, readCollection, STORAGE_KEYS, writeCollection } from "@/lib/prototypeStorage";
import type { GuestMeal } from "@/types/meal";
import type { GuestThaliType } from "@/types/settings";
import type { Role } from "@/types/user";

const seed = guestMeals as GuestMeal[];
export const getGuestMeals = (): GuestMeal[] => readCollection(STORAGE_KEYS.guestMeals, seed);

const assertCanChange = (role: Role, actorMemberId: string | undefined, memberId: string) => {
	void actorMemberId;
	void memberId;
	if (!hasFullAccess(role)) throw new Error("Member accounts are view-only.");
};

export type GuestMealInput = Omit<GuestMeal, "id" | "price" | "createdAt" | "updatedAt">;

export const addGuestMeal = (input: GuestMealInput, role: Role, actorMemberId?: string) => {
	assertCanChange(role, actorMemberId, input.memberId);
	const current = getGuestMeals();
	const timestamp = nowIso();
	const price = getSettings().guestThaliPrices[input.thaliType as GuestThaliType];
	const meal = { ...input, price, id: makeId("GMEAL", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	writeCollection(STORAGE_KEYS.guestMeals, [...current, meal]);
	return meal;
};

export const updateGuestMeal = (id: string, input: Partial<GuestMealInput>, role: Role, actorMemberId?: string) => {
	const current = getGuestMeals();
	const target = current.find((meal) => meal.id === id);
	if (!target) return null;
	assertCanChange(role, actorMemberId, target.memberId);
	const nextType = input.thaliType ?? target.thaliType;
	const updated = current.map((meal) => meal.id === id ? { ...meal, ...input, price: getSettings().guestThaliPrices[nextType as GuestThaliType], updatedAt: nowIso() } : meal);
	writeCollection(STORAGE_KEYS.guestMeals, updated);
	return updated.find((meal) => meal.id === id) ?? null;
};

export const cancelGuestMeal = (id: string, role: Role, actorMemberId?: string) => updateGuestMeal(id, { status: "cancelled" }, role, actorMemberId);