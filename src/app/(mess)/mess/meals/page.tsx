import type { Metadata } from "next";
import { MenusScreen } from "@/components/mess/MenusScreen";

export const metadata: Metadata = { title: "Meals" };

export const instant = false;

export default function MessMealsPage() {
  return <MenusScreen />;
}
