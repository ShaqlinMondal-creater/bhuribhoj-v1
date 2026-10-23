"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { roleLabel } from "@/lib/auth/roles";
import { userService, type PlatformUser, type UserWrite } from "@/services/userService";
import type { Role } from "@/types/auth";

const LIMITS = [10, 25, 50];
const ROLES: Role[] = ["admin", "president", "manager", "member"];

const fieldClass =
  "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--accent)]";

export function UsersScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<PlatformUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<{ mode: "detail" | "update" | "delete"; user: PlatformUser } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userService
      .fetch({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, role, status, limit, offset, reloadKey]);

  const filtered = search !== "" || role !== "" || status !== "";
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(count / limit));

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Mess Details"
        title="Users"
        description="Every account on the platform, including the admin."
      />
      {error ? <Notice>{error}</Notice> : null}
      {notice ? <p className="text-sm text-[var(--brand)]">{notice}</p> : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-56 flex-1 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          Search
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name, email, or mobile"
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          Role
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setOffset(0);
            }}
            className={fieldClass}
          >
            <option value="">All</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {roleLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
            className={fieldClass}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {loading && rows.length === 0 ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState
          icon="users"
          title={filtered ? "No accounts match" : "No users yet"}
          description={filtered ? "Try another name, email, mobile, role, or status." : "Accounts appear here after someone signs in or registers."}
        />
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-[0.12em] text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Mess</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-950">{user.name}</p>
                      {user.member_code ? <p className="text-xs text-stone-500">{user.member_code}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{labelFor(user.role)}</td>
                    <td className="px-4 py-3 text-stone-700">{user.mess?.name ?? "Platform"}</td>
                    <td className="px-4 py-3 text-stone-600">
                      <p>{user.email}</p>
                      {user.mobile ? <p className="text-xs text-stone-500">{user.mobile}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.status === "active" ? "bg-[var(--accent-soft)] text-[var(--brand)]" : "bg-stone-100 text-stone-500"}`}>
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Detail" icon="eye" onClick={() => setOpen({ mode: "detail", user })} />
                        <IconButton label="Update" icon="pencil" onClick={() => setOpen({ mode: "update", user })} />
                        <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", user })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {count > 10 ? (
            <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-4 py-3">
              <label className="flex items-center gap-2 text-xs text-stone-500">
                Limit
                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setOffset(0);
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm text-stone-800"
                >
                  {LIMITS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Pager page={page} pages={pages} onPage={(next) => setOffset((next - 1) * limit)} />
            </div>
          ) : null}
        </div>
      ) : null}

      {open?.mode === "detail" ? <DetailDialog user={open.user} onClose={() => setOpen(null)} /> : null}
      {open?.mode === "update" ? (
        <UpdateDialog
          user={open.user}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={(message) => setError(message)}
        />
      ) : null}
      {open?.mode === "delete" ? (
        <DeleteDialog
          user={open.user}
          onClose={() => setOpen(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else refresh();
          }}
          onFailed={(message) => setError(message)}
        />
      ) : null}
    </section>
  );
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  const items = pageItems(page, pages);

  return (
    <nav className="flex items-center gap-1" aria-label="Pages">
      {page > 1 ? (
        <button type="button" onClick={() => onPage(page - 1)} className="h-8 min-w-8 rounded-full px-2 text-sm text-stone-500 hover:bg-stone-100" aria-label="Previous page">
          ‹
        </button>
      ) : null}
      {items.map((item, index) =>
        item === "dot" ? (
          <span key={`dot-${index}`} className="px-1 text-stone-400">
            ·
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-current={item === page ? "page" : undefined}
            className={`h-8 min-w-8 rounded-full px-2 text-sm font-semibold ${
              item === page ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {item}
          </button>
        ),
      )}
    </nav>
  );
}

function pageItems(page: number, pages: number): Array<number | "dot"> {
  const window: number[] = [];
  for (let next = page; next < page + 3 && next <= pages; next += 1) window.push(next);
  const lastShown = window[window.length - 1] ?? page;
  if (lastShown < pages) return [...window, "dot", pages];
  return window;
}

function IconButton({ label, icon, onClick }: { label: string; icon: "eye" | "pencil" | "trash"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]"
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

function DetailDialog({ user, onClose }: { user: PlatformUser; onClose: () => void }) {
  const rows = [
    ["Name", user.name],
    ["Email", user.email],
    ["Mobile", user.mobile || "—"],
    ["Role", labelFor(user.role)],
    ["Status", user.status === "active" ? "Active" : "Inactive"],
    ["Mess", user.mess?.name ?? "Platform"],
    ["Member code", user.member_code || "—"],
    ["Room", user.room_no || "—"],
    ["Joined", user.joining_date ? user.joining_date.slice(0, 10) : "—"],
  ];

  return (
    <Dialog title="Detail" onClose={onClose}>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 text-sm">
            <dt className="text-stone-500">{label}</dt>
            <dd className="text-right font-medium text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

function UpdateDialog({
  user,
  onClose,
  onSaved,
  onFailed,
}: {
  user: PlatformUser;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<UserWrite>({
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await userService.update({ ...form, mobile: form.mobile?.trim() || null });
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not update the user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Update" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Name">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
        </Field>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} />
        </Field>
        <Field label="Mobile">
          <input value={form.mobile ?? ""} onChange={(event) => setForm({ ...form, mobile: event.target.value })} className={fieldClass} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className={fieldClass}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {roleLabel[item]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={fieldClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <button type="submit" disabled={pending} className="mt-2 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </Dialog>
  );
}

function DeleteDialog({
  user,
  onClose,
  onDeleted,
  onFailed,
}: {
  user: PlatformUser;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await userService.remove(user.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the user.");
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete {user.name}? The account is removed from the platform.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700">
          Cancel
        </button>
        <button type="button" onClick={onDelete} disabled={pending} className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-stone-500" aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
      {label}
      {children}
    </label>
  );
}

function labelFor(role: string) {
  if (role === "admin" || role === "president" || role === "manager" || role === "member") {
    return roleLabel[role];
  }
  return role;
}
