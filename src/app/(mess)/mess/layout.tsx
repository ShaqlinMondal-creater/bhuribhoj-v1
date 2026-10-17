import { MessSession } from "@/components/auth/MessSession";
import { isMessRole } from "@/lib/auth/roles";
import { getAuthRole, getAuthToken } from "@/lib/auth/session";
import { redirect } from "next/navigation";

/** Cookie check only. Live user data comes from GET /backend/auth/me in the browser. */
export const instant = false;

export default async function MessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  const role = await getAuthRole();
  if (!token || !role) redirect("/login");
  if (!isMessRole(role)) redirect("/admin");

  return <MessSession>{children}</MessSession>;
}
