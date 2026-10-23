"use client";

import { useRef, useState } from "react";
import { useMessUser, useSetMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { roleLabel } from "@/lib/auth/roles";
import { initials } from "@/lib/format";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

export function ProfileScreen() {
  const user = useMessUser();

  const setUser = useSetMessUser();

  if (!user) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  return (
    <ProfileForm
      key={`${user.name}|${user.email}|${user.mobile}|${user.avatar?.length ?? 0}`}
      user={user}
      onUser={setUser}
    />
  );
}

export function AccountProfile({
  user,
  onUser,
}: {
  user: AuthUser | null;
  onUser: (user: AuthUser) => void;
}) {
  if (!user) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  return (
    <ProfileForm
      key={`${user.name}|${user.email}|${user.mobile}|${user.avatar?.length ?? 0}`}
      user={user}
      onUser={onUser}
    />
  );
}

function ProfileForm({ user, onUser }: { user: AuthUser; onUser: (user: AuthUser) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setName(user.name);
    setEmail(user.email);
    setMobile(user.mobile ?? "");
    setPassword("");
    setConfirm("");
    setAvatar(user.avatar);
    setEditing(false);
    setError(null);
    setDone(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo.");
      return;
    }
    try {
      const next = await resizeAvatar(file);
      setAvatar(next);
      setEditing(true);
      setError(null);
    } catch {
      setError("That photo could not be read.");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (password && password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const next = await authService.updateProfile({
        name,
        email,
        mobile: mobile || undefined,
        avatar,
        ...(password
          ? { password, password_confirmation: confirm }
          : {}),
      });
      onUser(next);
      setPassword("");
      setConfirm("");
      setEditing(false);
      setDone("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-emerald-900">Profile</h1>
        <p className="mt-1 text-sm text-stone-500">View and update your account details.</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-3xl bg-emerald-950 px-6 py-8 text-emerald-50">
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-800 text-2xl font-semibold ring-4 ring-emerald-700/80"
              aria-label="Upload profile image"
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(name)
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-[10px] font-medium tracking-wide text-white opacity-0 transition group-hover:opacity-100">
                Upload
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                void onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <h2 className="mt-4 text-xl font-semibold">{name}</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">
              {roleLabel[user.role]}
            </p>
            <p className="mt-1 text-sm text-emerald-100/80">{user.memberCode ?? user.mess?.name}</p>
          </div>
          <dl className="mt-8 space-y-4 border-t border-white/10 pt-5 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Email</dt>
              <dd className="mt-1 break-all">{email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Mobile</dt>
              <dd className="mt-1">{mobile || "—"}</dd>
            </div>
          </dl>
        </aside>

        <form onSubmit={onSubmit} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">Account details</h2>
              <p className="mt-1 text-sm text-stone-500">Update name, contact info, and password.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                editing
                  ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
              aria-label={editing ? "Stop editing" : "Edit profile"}
              title={editing ? "Stop editing" : "Edit"}
            >
              <Icon name="pencil" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <input value={name} onChange={(event) => setName(event.target.value)} disabled={!editing} required className={fieldClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!editing} required className={fieldClass} />
            </Field>
            <Field label="Mobile no">
              <input value={mobile} onChange={(event) => setMobile(event.target.value)} disabled={!editing} className={fieldClass} />
            </Field>
            <Field label="New password">
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!editing}
                minLength={8}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
                toggleLabel="new password"
                className={fieldClass}
              />
            </Field>
            <Field label="Confirm password">
              <PasswordInput
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={!editing}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                toggleLabel="confirm password"
                className={fieldClass}
              />
            </Field>
          </div>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          {done ? <p className="mt-4 text-sm text-emerald-800">{done}</p> : null}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!editing || pending}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!editing || pending}
              className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 disabled:bg-stone-50 disabled:text-stone-600";

function resizeAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const max = 256;
      const scale = Math.min(max / image.width, max / image.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unreadable image"));
    };
    image.src = url;
  });
}
