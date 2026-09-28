import type { PublicUser, Role } from "@/types/user";

// The signed-in user. It is the public half of the unified user record, so the
// profile panel can show a member's real details and a staff member's, without
// ever having a password in the browser.
export type AuthenticatedUser = PublicUser;
export type { Role };
