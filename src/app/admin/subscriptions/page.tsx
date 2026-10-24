import type { Metadata } from "next";
import { SubscriptionsScreen } from "@/components/subscriptions/SubscriptionsScreen";

export const metadata: Metadata = { title: "Subscriptions" };

export const instant = false;

export default function AdminSubscriptionsPage() {
  return <SubscriptionsScreen scope="admin" />;
}
