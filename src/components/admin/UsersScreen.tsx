"use client";

import { useEffect, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { FilterBar, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { PageHeader } from "@/components/ui/PageHeader";
import { roleLabel } from "@/lib/auth/roles";
import { userService, type PlatformUser, type UserWrite } from "@/services/userService";
import type { Role } from "@/types/auth";

const ROLES: Role[] = ["admin", "president", "manager", "member"];

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
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}

      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Name, email, or mobile" />
        <FilterSelect
          label="Role"
          value={role}
          onChange={(value) => {
            setRole(value);
            setOffset(0);
          }}
          options={[{ value: "", label: "All" }, ...ROLES.map((item) => ({ value: item, label: roleLabel[item] }))]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FilterBar>

      <TableShell
        count={count}
        limit={limit}
        offset={offset}
        onLimit={(value) => {
          setLimit(value);
          setOffset(0);
        }}
        onOffset={setOffset}
        head={
          <tr>
            <th className={thClass()}>Name</th>
            <th className={thClass()}>Role</th>
            <th className={thClass()}>Mess</th>
            <th className={thClass()}>Contact</th>
            <th className={thClass()}>Status</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
              <TableStatus
                colSpan={6}
                loading={loading && rows.length === 0}
                empty={!loading && rows.length === 0 ? (filtered ? "No accounts match these filters." : "No users yet.") : null}
              />
                {rows.map((user) => (
                  <tr key={user.id} className={rowClass}>
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
      </TableShell>

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

function DetailDialog({ user, onClose }: { user: PlatformUser; onClose: () => void }) {
  const rows: Array<[string, string]> = [
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
      <DetailList rows={rows} valueClassName="text-right font-medium text-stone-900" />
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
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3">
          <TextField required fullWidth label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextField required fullWidth type="email" label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextField fullWidth label="Mobile" value={form.mobile ?? ""} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
          <TextField select fullWidth label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            {ROLES.map((item) => (
              <MenuItem key={item} value={item}>
                {roleLabel[item]}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <button type="submit" disabled={pending} className="mt-2 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      </MaterialScope>
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

function labelFor(role: string) {
  if (role === "admin" || role === "president" || role === "manager" || role === "member") {
    return roleLabel[role];
  }
  return role;
}
