import expenses from "@/data/json/expenses.json";
import { hasFullAccess } from "@/auth/authConfig";
import { makeId, nowIso, readCollection, STORAGE_KEYS, writeCollection } from "@/lib/prototypeStorage";
import type { Expense } from "@/types/expense";
import type { Role } from "@/types/user";

const seed = expenses as Expense[];
export const getExpenses = (): Expense[] => readCollection(STORAGE_KEYS.expenses, seed);
const assertCanManage = (role: Role) => { if (!hasFullAccess(role)) throw new Error("Only full-access roles can manage expenses."); };

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;
export const addExpense = (input: ExpenseInput, role: Role) => {
	assertCanManage(role);
	const current = getExpenses();
	const timestamp = nowIso();
	const expense = { ...input, id: makeId("EXP", current.map((item) => item.id)), createdAt: timestamp, updatedAt: timestamp };
	writeCollection(STORAGE_KEYS.expenses, [...current, expense]);
	return expense;
};
export const updateExpense = (id: string, input: Partial<ExpenseInput>, role: Role) => {
	assertCanManage(role);
	const updated = getExpenses().map((expense) => expense.id === id ? { ...expense, ...input, updatedAt: nowIso() } : expense);
	writeCollection(STORAGE_KEYS.expenses, updated);
	return updated.find((expense) => expense.id === id) ?? null;
};
export const deleteExpense = (id: string, role: Role) => {
	assertCanManage(role);
	const updated = getExpenses().filter((expense) => expense.id !== id);
	writeCollection(STORAGE_KEYS.expenses, updated);
};