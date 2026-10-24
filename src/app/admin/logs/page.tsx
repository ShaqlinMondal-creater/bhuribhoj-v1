import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Logs" };

export const instant = false;

export default function AdminLogsPage() {
  return (
    <SectionScreen
      title="Logs"
      icon="logs"
      description="A record of what changed on the platform."
    />
  );
}