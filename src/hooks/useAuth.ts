"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getCurrentUser,
  signIn as authenticate,
  signOut as clearSession,
  subscribeToSession,
} from "@/auth/authService";

export const useAuth = () => {
  const user = useSyncExternalStore(
    subscribeToSession,
    getCurrentUser,
    () => null,
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

  return { user, isSigningIn, error, signIn, signOut };
};