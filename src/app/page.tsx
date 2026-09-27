"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const auth = useAuth();

  if (!auth.user) {
    return <LoginScreen isSigningIn={auth.isSigningIn} error={auth.error} onSignIn={auth.signIn} />;
  }

  return <AppShell user={auth.user} onSignOut={auth.signOut} />;
}