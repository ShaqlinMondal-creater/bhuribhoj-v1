import type { Metadata } from "next";
import { AdminProfileScreen } from "@/components/admin/AdminProfileScreen";

export const metadata: Metadata = { title: "Profile" };

export const instant = false;

export default function AdminProfilePage() {
  return <AdminProfileScreen />;
}
