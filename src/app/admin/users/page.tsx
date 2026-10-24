import type { Metadata } from "next";
import { UsersScreen } from "@/components/admin/UsersScreen";

export const metadata: Metadata = { title: "Users" };

export const instant = false;

export default function AdminUsersPage() {
  return <UsersScreen />;
}
