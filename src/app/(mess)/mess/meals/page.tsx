import type { Metadata } from "next";
import { MealsScreen } from "@/components/mess/MealsScreen";

export const metadata: Metadata = { title: "Meals" };

export const instant = false;

export default function MessMealsPage() {
  return <MealsScreen />;
}
