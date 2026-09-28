import { NextResponse } from "next/server";
import { findRecord, verifyUserCredentials } from "@/lib/server/jsonRepository";
import type { PublicUser } from "@/types/user";

export const dynamic = "force-dynamic";

// SIGN-IN.
//
// The password is checked here, on the server, against the hash in users.json.
// The browser sends a password and gets back a user, never a password, so no
// route ever has to expose a credential for the client to compare locally.

/** A deliberately vague message, so the response cannot be used to discover which emails exist. */
const SIGN_IN_FAILED = "Email or password is incorrect.";

const readCredentials = (body: unknown): { email: string; password: string } | null => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { email, password } = body as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string") return null;
  if (email.trim() === "" || password === "") return null;
  return { email, password };
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const credentials = readCredentials(body);
  if (!credentials) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const verified = await verifyUserCredentials(credentials.email, credentials.password);
    if (!verified) {
      return NextResponse.json({ error: SIGN_IN_FAILED }, { status: 401 });
    }

    // Re-read through the normal find, so the signed-in user is the redacted
    // public record rather than anything taken from the stored hash.
    const user = await findRecord<PublicUser>("users", verified.id);
    if (!user) {
      return NextResponse.json({ error: SIGN_IN_FAILED }, { status: 401 });
    }

    return NextResponse.json({ data: { user } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
