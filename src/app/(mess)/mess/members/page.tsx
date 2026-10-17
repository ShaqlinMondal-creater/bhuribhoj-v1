import type { Metadata } from "next";
import { MembersScreen } from "@/components/mess/MembersScreen";

export const metadata: Metadata = { title: "Members" };

export const instant = false;

export default function MessMembersPage() {
  return <MembersScreen />;
}
