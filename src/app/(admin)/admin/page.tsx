import type { Metadata } from "next";
import { OverviewScreen } from "@/components/admin/OverviewScreen";

export const metadata: Metadata = { title: "Admin" };

export const instant = false;

export default function AdminHomePage() {
  return <OverviewScreen />;
}
