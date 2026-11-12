import type { Metadata } from "next";
import { ContactSupportScreen } from "@/components/admin/ContactSupportScreen";

export const metadata: Metadata = { title: "Contact support" };

export const instant = false;

export default function AdminContactSupportPage() {
  return <ContactSupportScreen />;
}
