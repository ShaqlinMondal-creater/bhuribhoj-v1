import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Daily Meals" };

export const instant = false;

export default function AdminDailyMealsPage() {
  return (
    <SectionScreen
      title="Daily Meals"
      icon="calendar"
      description="Meals counted for a house, one day at a time."
    />
  );
}
