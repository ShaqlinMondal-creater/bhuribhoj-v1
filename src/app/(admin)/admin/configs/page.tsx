import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Configs" };

export const instant = false;

export default function AdminConfigsPage() {
  return (
    <SectionScreen
      title="Configs"
      icon="sliders"
      description="Switches and values the platform reads."
    />
  );
}
