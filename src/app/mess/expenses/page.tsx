import type { Metadata } from "next";
import { ExpensesScreen } from "@/components/mess/ExpensesScreen";

export const metadata: Metadata = { title: "Expenses" };

export const instant = false;

export default function MessExpensesPage() {
  return <ExpensesScreen />;
}
