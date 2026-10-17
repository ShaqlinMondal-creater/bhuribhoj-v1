import type { Metadata } from "next";
import { InvitationsScreen } from "@/components/admin/InvitationsScreen";

export const metadata: Metadata = { title: "Invitations" };

export const instant = false;

export default function AdminInvitationsPage() {
  return <InvitationsScreen />;
}
