import type { Metadata } from "next";
import { SetupScreen } from "@/components/mess/SetupScreen";

export const metadata: Metadata = { title: "Mess details" };
export const instant = false;

export default function SetupPage() {
  return <SetupScreen />;
}