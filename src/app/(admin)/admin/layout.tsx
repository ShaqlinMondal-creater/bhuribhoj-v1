import { AdminSession } from "@/components/auth/AdminSession";
import { isAdmin } from "@/lib/auth/roles";
import { getAuthRole, getAuthToken } from "@/lib/auth/session";
import { redirect } from "next/navigation";

/** Cookie check only. Live user data comes from GET /backend/auth/me in the browser. */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  const role = await getAuthRole();
  if (!token || !role) redirect("/login");
  if (!isAdmin(role)) redirect("/mess");

  return <AdminSession>{children}</AdminSession>;
}
