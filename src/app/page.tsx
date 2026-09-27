"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/hooks/useAuth";
import { useServerData } from "@/hooks/useServerData";
import { ThemeController } from "@/components/layout/ThemeController";

export default function Home() {
  const auth = useAuth();
  const data = useServerData();

  if (auth.status === "loading" || data.status === "loading") {
    return <main className="route-loading" aria-label="Loading BhuriBhoj"><div className="loading-mark">B</div><div className="loading-line loading-line-wide" /><div className="loading-line" /></main>;
  }

  if (data.status === "error") {
    return <main className="route-loading" aria-label="BhuriBhoj data error"><h1>Could not load the data files</h1><p>{data.error}</p></main>;
  }

  if (auth.status === "authenticated" && auth.user) {
    return <><ThemeController /><AppShell user={auth.user} onSignOut={auth.signOut} /></>;
  }

  return <LoginScreen isSigningIn={auth.isSigningIn} error={auth.error} onSignIn={auth.signIn} />;
}