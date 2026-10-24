import type { Metadata } from "next";
import { MealsScreen } from "@/components/mess/MealsScreen";

export const metadata: Metadata = { title: "Daily Meals" };

export const instant = false;

export default function MessDailyMealsPage() {
  return <MealsScreen />;
}
