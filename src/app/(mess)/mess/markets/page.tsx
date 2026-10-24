import type { Metadata } from "next";
import { MarketsScreen } from "@/components/mess/MarketsScreen";

export const metadata: Metadata = { title: "Markets" };

export const instant = false;

export default function MessMarketsPage() {
  return <MarketsScreen />;
}
