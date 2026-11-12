import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Subscription and mess terms for BhuriBhoj.",
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
