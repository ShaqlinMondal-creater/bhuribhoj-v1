import type { Metadata } from "next";
import { ProfileScreen } from "@/components/mess/ProfileScreen";

export const metadata: Metadata = { title: "Profile" };

export const instant = false;

export default function MessProfilePage() {
  return <ProfileScreen />;
}
