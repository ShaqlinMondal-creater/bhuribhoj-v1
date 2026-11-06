import type { Metadata } from "next";
import { AdminDailyMealsScreen } from "@/components/admin/AdminDailyMealsScreen";

export const metadata: Metadata = { title: "Daily Meals" };

export const instant = false;

export default function AdminDailyMealsPage() {
  return <AdminDailyMealsScreen />;
}
