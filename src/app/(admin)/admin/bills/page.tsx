import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Bills" };

export const instant = false;

export default function AdminBillsPage() {
  return (
    <SectionScreen
      title="Bills"
      icon="receipt"
      description="Payments recorded against a mess subscription."
    />
  );
}
