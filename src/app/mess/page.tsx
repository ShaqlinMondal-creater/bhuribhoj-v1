import type { Metadata } from "next";
import { DashboardScreen } from "@/components/mess/DashboardScreen";

export const metadata: Metadata = { title: "Mess dashboard" };

export const instant = false;

export default function MessHomePage() {
  return <DashboardScreen />;
}
