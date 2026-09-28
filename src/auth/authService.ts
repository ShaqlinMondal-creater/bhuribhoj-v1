import { SESSION_STORAGE_KEY } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { loadUser, rememberSignedInUser, updateUser } from "@/services/userService";
import { ApiError, signInRequest } from "@/data/api";
import type { PublicUser } from "@/types/user";

// This is the ONLY module in the app that is allowed to use localStorage, and
// it stores nothing but the minimum needed to recognise a signed-in user on the
// next page load: which user was signed in, and when. No name, email, role or
// any other field, and no application dataset.
//
// A password is never handled here. signIn sends it to the server, which checks
// it against the hash in users.json, and the user that comes back has no
// password on it.
//
// The complete users collection is never fetched to resolve a session. A sign-in
// already answers with the record it accepted, and a returning visitor is asked
// for that one record by id, so a page load costs one small request rather than
// the whole directory.

type Session = {
	userId: string;
	signedInAt: string;
};

const sessionListeners = new Set<() => void>();

/** The user this tab has resolved, and the session it came from. */
let current: { userId: string; user: AuthenticatedUser } | null = null;

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

export const subscribeToSession = (listener: () => void) => {
	sessionListeners.add(listener);
	return () => {
		sessionListeners.delete(listener);
	};
};

const notifySessionListeners = () => {
	sessionListeners.forEach((listener) => listener());
};

export const getCurrentUser = (): AuthenticatedUser | null =>
	typeof window === "undefined" ? null : (current?.user ?? null);

/** The signed-in user, resolved against the server if this tab has not done it yet. */
export const restoreSession = async (): Promise<void> => {
	const session = readSession();
	if (!session) {
		if (current) {
			current = null;
			notifySessionListeners();
		}
		return;
	}
	if (current?.userId === session.userId) return;

	const user = await loadUser(session.userId);
	if (!user) {
		// The account the session names is gone, so the session is not usable.
		window.localStorage.removeItem(SESSION_STORAGE_KEY);
		current = null;
		notifySessionListeners();
		return;
	}
	current = { userId: session.userId, user };
	notifySessionListeners();
};

export const signIn = async (
	email: string,
	password: string,
): Promise<{ user?: AuthenticatedUser; error?: string }> => {
	try {
		const { user } = await signInRequest<{ user: PublicUser }>(email, password);
		// The server already answered with the record it accepted, so there is
		// nothing else to fetch to start the session.
		rememberSignedInUser(user);
		window.localStorage.setItem(
			SESSION_STORAGE_KEY,
			JSON.stringify({ userId: user.id, signedInAt: new Date().toISOString() } satisfies Session),
		);
		current = { userId: user.id, user };
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
	current = null;
	notifySessionListeners();
};

export const updateCurrentUserProfile = async (
	input: Pick<AuthenticatedUser, "name" | "email" | "mobile" | "image_url">,
) => {
	const signedIn = getCurrentUser();
	if (!signedIn) return null;
	// Writes users.json through the server, so the profile survives a refresh.
	const updated = await updateUser(signedIn.id, input);
	if (!updated) return null;
	// Keep the session pointing at the record that was just saved, so the header
	// and the profile form show the new values without another request.
	current = { userId: updated.id, user: updated };
	notifySessionListeners();
	return updated;
};
