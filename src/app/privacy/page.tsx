import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How BhuriBhoj handles mess ledger visibility and platform access.",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
