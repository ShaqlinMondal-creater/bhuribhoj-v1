import type { Metadata } from "next";
import { HouseScreen } from "@/components/mess/HouseScreen";

export const metadata: Metadata = { title: "House" };

export const instant = false;

export default function MessHousePage() {
  return <HouseScreen />;
}
