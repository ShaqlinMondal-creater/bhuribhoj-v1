import users from "@/data/json/users.json";
import type { AuthenticatedUser, DemoUser } from "@/auth/authTypes";
import { SESSION_STORAGE_KEY } from "@/auth/authConfig";

const demoUsers = users as DemoUser[];
const PROFILE_OVERRIDES_PREFIX = "bhuribhoj.profile.";
const sessionListeners = new Set<() => void>();
let cachedSession: AuthenticatedUser | null | undefined;

const withoutPassword = (user: DemoUser): AuthenticatedUser => {
  const seedProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.memberId ? { memberId: user.memberId } : {}),
    ...(user.mobile ? { mobile: user.mobile } : {}),
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
  if (typeof window === "undefined") return seedProfile;
  const stored = window.localStorage.getItem(`${PROFILE_OVERRIDES_PREFIX}${user.email.toLowerCase()}`);
  if (!stored) return seedProfile;
  try {
    return { ...seedProfile, ...(JSON.parse(stored) as Partial<AuthenticatedUser>) };
  } catch {
    return seedProfile;
  }
};

export const subscribeToSession = (listener: () => void) => {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
};

const notifySessionListeners = () => {
  sessionListeners.forEach((listener) => listener());
};

export const signIn = async (
  email: string,
  password: string,
): Promise<{ user?: AuthenticatedUser; error?: string }> => {
  const user = demoUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() &&
      candidate.password === password,
  );

  if (!user) {
    return { error: "That email and password combination is not recognised." };
  }

  const authenticatedUser = withoutPassword(user);
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(authenticatedUser),
  );
  cachedSession = authenticatedUser;
  notifySessionListeners();
  return { user: authenticatedUser };
};

export const signOut = () => {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  cachedSession = null;
  notifySessionListeners();
};

export const getCurrentUser = (): AuthenticatedUser | null => {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedSession) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(storedSession) as AuthenticatedUser;
    return cachedSession;
  } catch {
    signOut();
    return null;
  }
};

export const updateCurrentUserProfile = (input: Pick<AuthenticatedUser, "name" | "email" | "mobile" | "avatarUrl">) => {
  const current = getCurrentUser();
  if (!current) return null;
  const updated = { ...current, ...input };
  window.localStorage.setItem(`${PROFILE_OVERRIDES_PREFIX}${current.email.toLowerCase()}`, JSON.stringify({
    name: updated.name,
    email: updated.email,
    mobile: updated.mobile,
    avatarUrl: updated.avatarUrl,
  }));
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  cachedSession = updated;
  notifySessionListeners();
  return updated;
};