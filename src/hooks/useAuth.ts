"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCurrentUser,
  restoreSession,
  signIn as authenticate,
  signOut as clearSession,
  subscribeToSession,
} from "@/auth/authService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// The server has no localStorage, so the session store can only ever report
// "signed out" during SSR. The session itself is resolved in an effect: the
// server render and the hydration render both see nobody signed in, and once
// hydration has run the real session is read and, if there is one, the single
// user record it names is fetched. Until that settles the app shows its loading
// state, so no component ever reads a user that has not arrived yet.
export const useAuth = () => {
  const user = useSyncExternalStore(
    subscribeToSession,
    getCurrentUser,
    () => null,
  );
  const [isResolving, setIsResolving] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    restoreSession()
      .catch(() => {
        // A session that cannot be resolved is treated as no session; the login
        // screen is the right place for the user to be.
      })
      .finally(() => {
        if (active) setIsResolving(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const status: AuthStatus = isResolving
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated";

  return { user, status, isSigningIn, error, signIn, signOut };
};