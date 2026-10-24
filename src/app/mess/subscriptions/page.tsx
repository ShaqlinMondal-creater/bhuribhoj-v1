import type { Metadata } from "next";
import { MessSubscriptionsScreen } from "@/components/subscriptions/SubscriptionsScreen";

export const metadata: Metadata = { title: "Subscriptions" };

export const instant = false;

export default function MessSubscriptionsPage() {
  return <MessSubscriptionsScreen />;
}
