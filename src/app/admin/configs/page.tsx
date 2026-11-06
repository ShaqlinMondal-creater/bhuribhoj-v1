import type { Metadata } from "next";
import { ConfigsScreen } from "@/components/admin/ConfigsScreen";

export const metadata: Metadata = { title: "Configs" };

export const instant = false;

export default function AdminConfigsPage() {
  return <ConfigsScreen />;
}
