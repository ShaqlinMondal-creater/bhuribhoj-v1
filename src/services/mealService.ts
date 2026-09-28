import { hasFullAccess } from "@/auth/authConfig";
import { ensureCollection, getCollection, setCollection } from "@/data/memoryStore";
import { createRecordRequest, deleteRecordRequest, updateRecordRequest } from "@/data/api";
import { makeId, nowIso } from "@/lib/ids";
import type { Meal } from "@/types/meal";
import type { Role } from "@/types/user";

// Reads come from the in-memory mirror of meals.json; every write goes through
// the server so the JSON file is updated before the UI reports success.
//
// Meals are only fetched when a view that shows them is opened, so a write asks
// for the collection first if nobody has. That keeps the id the app hands the
// server in step with the ids already stored.
export const getMeals = (): Meal[] => getCollection<Meal[]>("meals");

const assertCanChange = (role: Role, actorMemberId: string | undefined, memberId: string) => {
	void actorMemberId;
	void memberId;
	if (!hasFullAccess(role)) throw new Error("Member accounts are view-only.");
};

const applyToCache = (id: string, record: Meal) => {
  const current = getMeals();
  setCollection(
    "meals",
    current.some((meal) => meal.id === id)
      ? current.map((meal) => (meal.id === id ? record : meal))
      : [...current, record],
  );
};

export const addMeal = async (
	input: Omit<Meal, "id" | "createdAt" | "updatedAt">,
	role: Role,
	actorMemberId?: string,
) => {
	assertCanChange(role, actorMemberId, input.memberId);
	const current = await ensureCollection<Meal[]>("meals");
	if (current.some((meal) => meal.memberId === input.memberId && meal.date === input.date && meal.mealType === input.mealType && meal.status === "taken")) throw new Error("This meal is already recorded.");
	const timestamp = nowIso();
	const meal = { ...input, id: makeId("MEAL", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	const saved = await createRecordRequest<Meal>("meals", meal);
	applyToCache(saved.id, saved);
	return saved;
};

export const updateMeal = async (
	id: string,
	input: Partial<Omit<Meal, "id" | "createdAt">>,
	role: Role,
	actorMemberId?: string,
) => {
	const rows = await ensureCollection<Meal[]>("meals");
	const target = rows.find((meal) => meal.id === id);
	if (!target) return null;
	assertCanChange(role, actorMemberId, target.memberId);
	const saved = await updateRecordRequest<Meal>("meals", id, { ...input, updatedAt: nowIso() });
	applyToCache(saved.id, saved);
	return saved;
};

export const cancelMeal = (id: string, role: Role, actorMemberId?: string) =>
	updateMeal(id, { status: "cancelled" }, role, actorMemberId);

export const deleteMeal = async (id: string, role: Role, actorMemberId?: string) => {
  const target = (await ensureCollection<Meal[]>("meals")).find((meal) => meal.id === id);
  if (!target) return false;
  assertCanChange(role, actorMemberId, target.memberId);
  await deleteRecordRequest("meals", id);
  setCollection("meals", getMeals().filter((meal) => meal.id !== id));
  return true;
};
