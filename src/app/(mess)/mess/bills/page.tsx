import type { Metadata } from "next";
import { MessBillsScreen } from "@/components/mess/MessBillsScreen";

export const metadata: Metadata = { title: "Bills" };

export const instant = false;

export default function MessBillsPage() {
  return <MessBillsScreen />;
}
