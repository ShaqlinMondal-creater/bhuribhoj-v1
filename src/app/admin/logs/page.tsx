import type { Metadata } from "next";
import { LogsScreen } from "@/components/admin/LogsScreen";

export const metadata: Metadata = { title: "Logs" };

export const instant = false;

export default function AdminLogsPage() {
  return <LogsScreen />;
}
