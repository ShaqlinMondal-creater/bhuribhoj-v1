import type { Metadata } from "next";
import { CouponsScreen } from "@/components/admin/CouponsScreen";

export const metadata: Metadata = { title: "Coupons" };

export const instant = false;

export default function AdminCouponsPage() {
  return <CouponsScreen />;
}
