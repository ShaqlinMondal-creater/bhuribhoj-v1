import type { Metadata } from "next";
import { PaymentsScreen } from "@/components/admin/PaymentsScreen";

export const metadata: Metadata = { title: "Bills" };

export const instant = false;

export default function AdminBillsPage() {
  return <PaymentsScreen />;
}
