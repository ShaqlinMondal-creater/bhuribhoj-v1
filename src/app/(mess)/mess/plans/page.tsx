import type { Metadata } from "next";
import { PlansScreen } from "@/components/mess/PlansScreen";

export const metadata: Metadata = { title: "Plans" };
export const instant = false;

export default function PlansPage() {
  return <PlansScreen />;
}
