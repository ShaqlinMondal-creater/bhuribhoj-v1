import { SESSION_STORAGE_KEY } from "@/auth/authConfig";
import type { AuthenticatedUser, DemoUser } from "@/auth/authTypes";
import { getStoreVersion, subscribeToStore } from "@/data/memoryStore";
import { findUserByEmail, findUserById, updateUser } from "@/services/userService";

// This is the ONLY module in the app that is allowed to use localStorage, and
// it stores nothing but the minimum needed to recognise a signed-in user on the
// next page load: which user was signed in, and when. No name, email, role,
// mobile or avatar, and no application dataset.

type Session = {
	userId: string;
	signedInAt: string;
};

const sessionListeners = new Set<() => void>();
let cache: { raw: string | null; version: number; user: AuthenticatedUser | null } | null = null;

const toAuthenticatedUser = (user: DemoUser): AuthenticatedUser => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
	...(user.memberId ? { memberId: user.memberId } : {}),
	...(user.mobile ? { mobile: user.mobile } : {}),
	...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
});

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
	const user = findUserById(session.userId);
	return user ? toAuthenticatedUser(user) : null;
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
	const user = findUserByEmail(email);

	if (!user || user.password !== password) {
		return { error: "That email and password combination is not recognised." };
	}

	window.localStorage.setItem(
		SESSION_STORAGE_KEY,
		JSON.stringify({ userId: user.id, signedInAt: new Date().toISOString() } satisfies Session),
	);

	const authenticatedUser = toAuthenticatedUser(user);
	cache = null;
	notifySessionListeners();
	return { user: authenticatedUser };
};

export const signOut = () => {
	window.localStorage.removeItem(SESSION_STORAGE_KEY);
	cache = null;
	notifySessionListeners();
};

export const updateCurrentUserProfile = async (
	input: Pick<AuthenticatedUser, "name" | "email" | "mobile" | "avatarUrl">,
) => {
	const current = getCurrentUser();
	if (!current) return null;
	// Writes users.json through the server, so the profile survives a refresh.
	const updated = await updateUser(current.id, input);
	if (!updated) return null;
	// The store subscription above already invalidated the cache and notified
	// subscribers, because updateUser writes the record back into the cache.
	return toAuthenticatedUser(updated);
};
