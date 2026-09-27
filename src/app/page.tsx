"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/hooks/useAuth";
import { ThemeController } from "@/components/layout/ThemeController";

export default function Home() {
  const auth = useAuth();

  if (auth.user) {
    return <><ThemeController /><AppShell user={auth.user} onSignOut={auth.signOut} /></>;
  }

  if (!auth.user) {
    return <LoginScreen isSigningIn={auth.isSigningIn} error={auth.error} onSignIn={auth.signIn} />;
  }

  return null;
}