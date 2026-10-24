"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { fieldClass as baseFieldClass } from "@/components/ui/classes";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { isPresident, roleLabel } from "@/lib/auth/roles";
import { inr, initials } from "@/lib/format";
import { depositService, type DepositRow } from "@/services/depositService";
import { memberService, type MemberFilters, type MembersPage } from "@/services/memberService";
import type { LaravelUser, Role } from "@/types/auth";

export function MembersScreen() {
  const user = useMessUser();
  const allowed = user != null && user.role !== "member";
  const president = isPresident(user?.role);
  const [filters, setFilters] = useState<MemberFilters>({
    search: "",
    role: "",
    status: "",
    room_no: "",
    limit: 10,
    offset: 0,
  });
  const [list, setList] = useState<MembersPage | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(allowed);
  const [refreshKey, setRefreshKey] = useState(0);
  const deposits = useApi(() => depositService.fetchAll(user?.role ?? "president"), president);
  const rows = list?.data ?? [];
  const depositsByUser = new Map<number, DepositRow[]>();
  for (const deposit of deposits.data ?? []) {
    const bucket = depositsByUser.get(deposit.user_id) ?? [];
    bucket.push(deposit);
    depositsByUser.set(deposit.user_id, bucket);
  }
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LaravelUser | null>(null);

  useEffect(() => {
    if (!allowed || !user) {
      setListLoading(false);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    memberService
      .fetch(user.role, filters)
      .then((value) => {
        if (!cancelled) {
          setList(value);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setListError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [allowed, filters, refreshKey, user]);

  function patchFilters(partial: Partial<MemberFilters>, resetPage = true) {
    setFilters((current) => ({
      ...current,
      ...partial,
      offset: resetPage ? 0 : (partial.offset ?? current.offset ?? 0),
    }));
  }

  if (!user) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
  }

  if (user.role === "member") {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="People"
          title="Members"
          description="Only the president and managers can view the member list."
        />
        <EmptyState
          icon="users"
          title="Restricted"
          description="Ask the president if you need a change to the roster."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="People"
          title="Members"
          description={
            president
              ? "People seated in this mess."
              : "People in this mess. Adding a member stays with the president."
          }
        />
        {president ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Add member
          </button>
        ) : null}
      </div>
      <MemberFiltersBar
        filters={filters}
        rooms={list?.rooms ?? []}
        onChange={patchFilters}
      />
      {listError ? <Notice>{listError}</Notice> : null}
      {deposits.error ? <Notice>{deposits.error}</Notice> : null}
      <TableShell
        count={list?.count ?? rows.length}
        limit={filters.limit ?? 10}
        offset={filters.offset ?? 0}
        onLimit={(limit) => patchFilters({ limit })}
        onOffset={(offset) => patchFilters({ offset }, false)}
        head={
          <tr>
            <th className={thClass()}>Name</th>
            <th className={thClass()}>Code</th>
            <th className={thClass()}>Room</th>
            <th className={thClass()}>Role</th>
            <th className={thClass()}>Status</th>
            {president ? <th className={thClass("right")}>Action</th> : null}
          </tr>
        }
      >
        <TableStatus
          colSpan={president ? 6 : 5}
          loading={listLoading}
          empty={!listLoading && rows.length === 0 ? "No members yet." : null}
        />
        {rows.map((row) => (
          <tr key={String(row.id)} className={rowClass}>
            <td className="px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--brand)]">
                  {initials(row.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{row.name}</p>
                  <p className="truncate text-xs text-stone-500">{row.email}</p>
                </div>
              </div>
              <div className="mt-2">
                <MemberDeposits rows={depositsByUser.get(Number(row.id)) ?? []} />
              </div>
            </td>
            <td className="px-4 py-3 align-top text-stone-600">{row.member_code ?? "—"}</td>
            <td className="px-4 py-3 align-top text-stone-600">{row.room_no ?? "—"}</td>
            <td className="px-4 py-3 align-top">
              <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                {roleLabel[row.role as Role] ?? row.role}
              </span>
            </td>
            <td className="px-4 py-3 align-top">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--brand)]">
                {row.status ?? "active"}
              </span>
            </td>
            {president ? (
              <td className="px-4 py-3 align-top">
                <div className="flex justify-end">
                  <IconButton label={`Edit ${row.name}`} icon="pencil" iconClassName="h-3.5 w-3.5" onClick={() => setEditing(row)} />
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </TableShell>

      {adding ? (
        <AddMemberDialog
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      ) : null}
      {editing ? (
        <EditMemberDialog
          member={editing}
          self={String(editing.id) === user.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((value) => value + 1);
          }}
        />
      ) : null}
    </section>
  );
}

function AddMemberDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await memberService.create("president", {
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
        mobile: String(data.get("mobile") ?? "") || undefined,
        room_no: String(data.get("room_no") ?? "") || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the member.");
      setPending(false);
    }
  }

  return (
    <Dialog title="Add member" onClose={onClose} size="lg" backdrop="stone" closeClassName="text-sm font-medium text-stone-500 hover:text-stone-800">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-stone-600">
          Name
          <input name="name" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Email
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Password
          <PasswordInput name="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Mobile
          <input name="mobile" className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Room
          <input name="room_no" className={fieldClass} />
        </label>
        {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
            {pending ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function EditMemberDialog({
  member,
  self,
  onClose,
  onSaved,
}: {
  member: LaravelUser;
  self: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await memberService.update("president", {
        user_id: Number(member.id),
        name: String(data.get("name") ?? ""),
        mobile: String(data.get("mobile") ?? "") || undefined,
        room_no: String(data.get("room_no") ?? "") || undefined,
        status: String(data.get("status") ?? "active") === "inactive" ? "inactive" : "active",
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the member.");
      setPending(false);
    }
  }

  return (
    <Dialog title="Edit member" onClose={onClose} size="lg" backdrop="stone" closeClassName="text-sm font-medium text-stone-500 hover:text-stone-800">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Name
          <input name="name" required defaultValue={member.name} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Mobile
          <input name="mobile" defaultValue={member.mobile ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Room
          <input name="room_no" defaultValue={member.room_no ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Status
          <select name="status" defaultValue={member.status ?? "active"} disabled={self} className={fieldClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function MemberFiltersBar({
  filters,
  rooms,
  onChange,
}: {
  filters: MemberFilters;
  rooms: string[];
  onChange: (partial: Partial<MemberFilters>, resetPage?: boolean) => void;
}) {
  const typedRoom = (filters.room_no ?? "").toLowerCase();
  const roomOptions = rooms.filter((room) => room.toLowerCase().includes(typedRoom));

  return (
    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 md:grid-cols-4">
      <label className="block text-sm text-stone-600 md:col-span-2">
        Search
        <input
          value={filters.search ?? ""}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Name, email, member id, code, or mobile"
          className={fieldClass}
        />
      </label>
      <label className="block text-sm text-stone-600">
        Role
        <select
          value={filters.role ?? ""}
          onChange={(event) => onChange({ role: event.target.value as MemberFilters["role"] })}
          className={fieldClass}
        >
          <option value="">All roles</option>
          <option value="president">President</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
      </label>
      <div className="block text-sm text-stone-600">
        Status
        <div className="mt-1 flex rounded-xl border border-stone-200 p-1">
          {(
            [
              ["", "All"],
              ["active", "Active"],
              ["inactive", "Inactive"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ status: value })}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                (filters.status ?? "") === value ? "bg-emerald-800 text-white" : "text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="group relative block text-sm text-stone-600 md:col-span-2">
        Room
        <input
          value={filters.room_no ?? ""}
          onChange={(event) => onChange({ room_no: event.target.value })}
          placeholder="Search a room"
          className={fieldClass}
          autoComplete="off"
        />
        {roomOptions.length > 0 ? (
          <ul className="absolute z-10 mt-1 hidden max-h-40 w-full overflow-auto rounded-xl border border-stone-200 bg-white shadow-lg group-focus-within:block">
            {roomOptions.map((room) => (
              <li key={room}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange({ room_no: room })}
                  className="block w-full px-3 py-2 text-left text-sm text-stone-800 hover:bg-emerald-50"
                >
                  {room}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </label>
    </div>
  );
}

function MemberDeposits({ rows }: { rows: DepositRow[] }) {
  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        Deposits · {inr(total)}
      </p>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-stone-500">No deposits yet.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
              <span className="text-stone-600">
                {labelFor(row.deposit_type)} · {labelFor(row.fund_type)}
                {row.for_month ? ` · ${row.for_month}` : ""}
                {" · "}
                {String(row.deposited_on).slice(0, 10)}
                {row.note ? ` · ${row.note}` : ""}
              </span>
              <span className="font-medium text-stone-900">{inr(Number(row.amount))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function labelFor(value: string) {
  return value.replaceAll("_", " ");
}

const fieldClass = `${baseFieldClass} disabled:bg-stone-50`;
