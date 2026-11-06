import type { Metadata } from "next";
import { AdminMealsScreen } from "@/components/admin/AdminMealsScreen";

export const metadata: Metadata = { title: "Meals" };

export const instant = false;

export default function AdminMealsPage() {
  return <AdminMealsScreen />;
}
