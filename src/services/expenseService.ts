import { hasFullAccess } from "@/auth/authConfig";
import { getCollection, setCollection } from "@/data/memoryStore";
import { createRecordRequest, deleteRecordRequest, updateRecordRequest } from "@/data/api";
import { makeId, nowIso } from "@/lib/ids";
import type { Expense } from "@/types/expense";
import type { Role } from "@/types/user";

export const getExpenses = (): Expense[] => getCollection<Expense[]>("expenses");
const assertCanManage = (role: Role) => { if (!hasFullAccess(role)) throw new Error("Only full-access roles can manage expenses."); };

const applyToCache = (id: string, record: Expense) => {
  const current = getExpenses();
  setCollection(
    "expenses",
    current.some((expense) => expense.id === id)
      ? current.map((expense) => (expense.id === id ? record : expense))
      : [...current, record],
  );
};

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;
export const addExpense = async (input: ExpenseInput, role: Role) => {
	assertCanManage(role);
	const current = getExpenses();
	const timestamp = nowIso();
	const expense = { ...input, id: makeId("EXP", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	const saved = await createRecordRequest<Expense>("expenses", expense);
	applyToCache(saved.id, saved);
	return saved;
};
export const updateExpense = async (id: string, input: Partial<ExpenseInput>, role: Role) => {
	assertCanManage(role);
	const saved = await updateRecordRequest<Expense>("expenses", id, { ...input, updatedAt: nowIso() });
	applyToCache(saved.id, saved);
	return saved;
};
export const deleteExpense = async (id: string, role: Role) => {
	assertCanManage(role);
	await deleteRecordRequest("expenses", id);
	setCollection("expenses", getExpenses().filter((expense) => expense.id !== id));
};
