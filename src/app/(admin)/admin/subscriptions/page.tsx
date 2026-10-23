import type { Metadata } from "next";
import { SectionScreen } from "@/components/admin/SectionScreen";

export const metadata: Metadata = { title: "Subscriptions" };

export const instant = false;

export default function AdminSubscriptionsPage() {
  return (
    <SectionScreen
      title="Subscriptions"
      icon="card"
      description="Which mess bought a plan, and how long it runs."
    />
  );
}
