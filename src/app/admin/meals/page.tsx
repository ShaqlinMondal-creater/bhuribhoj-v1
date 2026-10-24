import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Meals" };

export const instant = false;

export default function AdminMealsPage() {
  return (
    <SectionScreen
      title="Meals"
      icon="meals"
      description="Meal names and prices kept for each mess."
    />
  );
}
