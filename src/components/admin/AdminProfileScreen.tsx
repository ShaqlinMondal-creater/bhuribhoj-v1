"use client";

import { useAdminUser, useSetAdminUser } from "@/components/auth/AdminSession";
import { AccountProfile } from "@/components/mess/ProfileScreen";

export function AdminProfileScreen() {
  const user = useAdminUser();
  const setUser = useSetAdminUser();
  return <AccountProfile user={user} onUser={setUser} />;
}
