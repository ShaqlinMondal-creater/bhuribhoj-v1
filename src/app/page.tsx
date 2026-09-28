"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/hooks/useAuth";
import { ThemeController } from "@/components/layout/ThemeController";

// The page itself fetches nothing. Signing in resolves one user record, and the
// workspace asks for the rest of what it shows as each view is opened.
export default function Home() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <main className="route-loading" aria-label="Loading BhuriBhoj"><div className="loading-mark">B</div><div className="loading-line loading-line-wide" /><div className="loading-line" /></main>;
  }

  if (auth.status === "authenticated" && auth.user) {
    return <><ThemeController /><AppShell user={auth.user} onSignOut={auth.signOut} /></>;
  }

  return <LoginScreen isSigningIn={auth.isSigningIn} error={auth.error} onSignIn={auth.signIn} />;
}
