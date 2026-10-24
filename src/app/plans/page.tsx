import type { Metadata } from "next";
import { PlansScreen } from "@/components/plans/PlansScreen";

export const metadata: Metadata = {
  title: "Plans",
  description: "One mess, one subscription: a month, a semester, or a year on BhuriBhoj.",
  openGraph: {
    title: "Plans · BhuriBhoj",
    description: "Compare a month, a semester, and a year. The house is the same.",
  },
};

export default function PlansPage() {
  return <PlansScreen />;
}
