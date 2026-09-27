import { hasFullAccess } from "@/auth/authConfig";
import { getCollection, setCollection } from "@/data/memoryStore";
import { createRecordRequest, deleteRecordRequest, updateRecordRequest } from "@/data/api";
import { getSettings } from "@/services/messService";
import { makeId, nowIso } from "@/lib/ids";
import type { GuestMeal } from "@/types/meal";
import type { GuestThaliType } from "@/types/settings";
import type { Role } from "@/types/user";

export const getGuestMeals = (): GuestMeal[] => getCollection<GuestMeal[]>("guestMeals");

const assertCanChange = (role: Role, actorMemberId: string | undefined, memberId: string) => {
	void actorMemberId;
	void memberId;
	if (!hasFullAccess(role)) throw new Error("Member accounts are view-only.");
};

const priceFor = (thaliType: GuestThaliType) =>
	getSettings().guestThaliPrices[thaliType];

const applyToCache = (id: string, record: GuestMeal) => {
  const current = getGuestMeals();
  setCollection(
    "guestMeals",
    current.some((meal) => meal.id === id)
      ? current.map((meal) => (meal.id === id ? record : meal))
      : [...current, record],
  );
};

export type GuestMealInput = Omit<GuestMeal, "id" | "price" | "createdAt" | "updatedAt">;

export const addGuestMeal = async (
	input: GuestMealInput,
	role: Role,
	actorMemberId?: string,
) => {
	assertCanChange(role, actorMemberId, input.memberId);
	const current = getGuestMeals();
	const timestamp = nowIso();
	const price = priceFor(input.thaliType as GuestThaliType);
	const meal = { ...input, price, id: makeId("GMEAL", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	const saved = await createRecordRequest<GuestMeal>("guestMeals", meal);
	applyToCache(saved.id, saved);
	return saved;
};

export const updateGuestMeal = async (
	id: string,
	input: Partial<GuestMealInput>,
	role: Role,
	actorMemberId?: string,
) => {
	const current = getGuestMeals();
	const target = current.find((meal) => meal.id === id);
	if (!target) return null;
	assertCanChange(role, actorMemberId, target.memberId);
	const nextType = (input.thaliType ?? target.thaliType) as GuestThaliType;
	const saved = await updateRecordRequest<GuestMeal>("guestMeals", id, {
		...input,
		price: priceFor(nextType),
		updatedAt: nowIso(),
	});
	applyToCache(saved.id, saved);
	return saved;
};

export const cancelGuestMeal = (id: string, role: Role, actorMemberId?: string) =>
	updateGuestMeal(id, { status: "cancelled" }, role, actorMemberId);

export const deleteGuestMeal = async (id: string, role: Role, actorMemberId?: string) => {
  const target = getGuestMeals().find((meal) => meal.id === id);
  if (!target) return false;
  assertCanChange(role, actorMemberId, target.memberId);
  await deleteRecordRequest("guestMeals", id);
  setCollection("guestMeals", getGuestMeals().filter((meal) => meal.id !== id));
  return true;
};
