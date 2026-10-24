import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Coupons" };

export const instant = false;

export default function AdminCouponsPage() {
  return (
    <SectionScreen
      title="Coupons"
      icon="ticket"
      description="Codes that change the price of a plan."
    />
  );
}
