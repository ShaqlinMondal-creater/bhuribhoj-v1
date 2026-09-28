import { SESSION_STORAGE_KEY } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { getStoreVersion, subscribeToStore } from "@/data/memoryStore";
import { ApiError, signInRequest } from "@/data/api";
import { findUserById, refreshUsers, updateUser } from "@/services/userService";
import type { PublicUser } from "@/types/user";

// This is the ONLY module in the app that is allowed to use localStorage, and
// it stores nothing but the minimum needed to recognise a signed-in user on the
// next page load: which user was signed in, and when. No name, email, role or
// any other field, and no application dataset.
//
// A password is never handled here. signIn sends it to the server, which checks
// it against the hash in users.json, and the user that comes back has no
// password on it. Resolving the signed-in user afterwards is a lookup in the
// already-loaded users.json mirror, not a credential check.

type Session = {
	userId: string;
	signedInAt: string;
};

const sessionListeners = new Set<() => void>();
let cache: { raw: string | null; version: number; user: AuthenticatedUser | null } | null = null;

const readSession = (): Session | null => {
	const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as Partial<Session>;
		return typeof parsed?.userId === "string" ? { userId: parsed.userId, signedInAt: parsed.signedInAt ?? "" } : null;
	} catch {
		return null;
	}
};

const resolveUser = (): AuthenticatedUser | null => {
	const session = readSession();
	if (!session) return null;
	return findUserById(session.userId);
};

export const subscribeToSession = (listener: () => void) => {
	sessionListeners.add(listener);
	return () => {
		sessionListeners.delete(listener);
	};
};

const notifySessionListeners = () => {
	sessionListeners.forEach((listener) => listener());
};

// The resolved user is derived from the store, so any store change can
// invalidate it (editing a profile is one of them). This is the single place
// that reacts to store changes, so profile edits do not notify twice.
subscribeToStore(() => {
	cache = null;
	notifySessionListeners();
});

export const getCurrentUser = (): AuthenticatedUser | null => {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
	const version = getStoreVersion();
	if (cache && cache.raw === raw && cache.version === version) return cache.user;
	const user = resolveUser();
	cache = { raw, version, user };
	return user;
};

export const signIn = async (
	email: string,
	password: string,
): Promise<{ user?: AuthenticatedUser; error?: string }> => {
	try {
		const { user } = await signInRequest<{ user: PublicUser }>(email, password);
		// The mirror the rest of the app reads is refreshed from the server, so a
		// sign-in sees the same records the rest of the session will.
		await refreshUsers();
		window.localStorage.setItem(
			SESSION_STORAGE_KEY,
			JSON.stringify({ userId: user.id, signedInAt: new Date().toISOString() } satisfies Session),
		);
		cache = null;
		notifySessionListeners();
		return { user };
	} catch (error) {
		// The server's message is deliberately vague about which half was wrong,
		// and it is safe to show as-is.
		return {
			error:
				error instanceof ApiError
					? error.message
					: "Could not sign in right now. Please try again.",
		};
	}
};

export const signOut = () => {
	window.localStorage.removeItem(SESSION_STORAGE_KEY);
	cache = null;
	notifySessionListeners();
};

export const updateCurrentUserProfile = async (
	input: Pick<AuthenticatedUser, "name" | "email" | "mobile" | "image_url">,
) => {
	const current = getCurrentUser();
	if (!current) return null;
	// Writes users.json through the server, so the profile survives a refresh.
	const updated = await updateUser(current.id, input);
	if (!updated) return null;
	// The store subscription above already invalidated the cache and notified
	// subscribers, because updateUser writes the record back into the cache.
	return updated;
};
