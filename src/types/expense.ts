export type ExpenseCategory =
	| "Cook Salary"
	| "Gas"
	| "Electricity"
	| "Cleaning"
	| "Internet"
	| "Other Fixed Charges"
	| "Rice"
	| "Vegetables"
	| "Fish"
	| "Chicken"
	| "Egg"
	| "Oil"
	| "Spices"
	| "Grocery"
	| "Other Market Expense";

export type Expense = {
	id: string;
	date: string;
	category: ExpenseCategory;
	amount: number;
	type: "fixed" | "market";
	note: string;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
};