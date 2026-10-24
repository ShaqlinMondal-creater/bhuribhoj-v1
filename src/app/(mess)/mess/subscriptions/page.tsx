import type { Metadata } from "next";
import { SubscriptionDetailScreen } from "@/components/mess/SubscriptionDetailScreen";

export const metadata: Metadata = { title: "Subscriptions" };

export const instant = false;

export default function MessSubscriptionsPage() {
  return <SubscriptionDetailScreen />;
}
