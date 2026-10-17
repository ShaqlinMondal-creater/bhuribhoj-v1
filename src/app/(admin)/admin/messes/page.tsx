import type { Metadata } from "next";
import { MessesScreen } from "@/components/admin/MessesScreen";

export const metadata: Metadata = { title: "Messes" };

export const instant = false;

export default function AdminMessesPage() {
  return <MessesScreen />;
}
