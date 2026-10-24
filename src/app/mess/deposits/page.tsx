import type { Metadata } from "next";
import { DepositsScreen } from "@/components/mess/DepositsScreen";

export const metadata: Metadata = { title: "Deposites" };

export const instant = false;

export default function MessDepositsPage() {
  return <DepositsScreen />;
}
