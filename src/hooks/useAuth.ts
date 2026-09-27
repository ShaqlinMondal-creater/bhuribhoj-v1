"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getCurrentUser,
  signIn as authenticate,
  signOut as clearSession,
  subscribeToSession,
} from "@/auth/authService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// The server has no localStorage, so the session store can only ever report
// "signed out" during SSR. A second store tracks hydration itself: React drives
// both the server render and the hydration render from getServerSnapshot, then
// re-renders with the client snapshot once hydration completes. That transition
// is the signal that the real session is now readable, and it needs no effect.
const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export const useAuth = () => {
  const user = useSyncExternalStore(
    subscribeToSession,
    getCurrentUser,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    setError("");
    const result = await authenticate(email, password);
    if (!result.user) {
      setError(result.error ?? "Unable to sign in.");
    }
    setIsSigningIn(false);
    return Boolean(result.user);
  };

  const signOut = () => {
    clearSession();
  };

  const status: AuthStatus = !isHydrated
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated";

  return { user, status, isSigningIn, error, signIn, signOut };
};