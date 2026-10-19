import { redirect } from "next/navigation";

export const instant = false;

export default function MessManagersPage() {
  redirect("/mess/members");
}
