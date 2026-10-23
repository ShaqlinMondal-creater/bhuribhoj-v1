import type { Metadata } from "next";
import { PlansScreen } from "@/components/admin/PlansScreen";

export const metadata: Metadata = { title: "Plans" };

export const instant = false;

export default function AdminPlansPage() {
  return <PlansScreen />;
}
