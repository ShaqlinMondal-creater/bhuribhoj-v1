"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { isPresident, roleLabel } from "@/lib/auth/roles";
import { inr, initials } from "@/lib/format";
import { depositService, type DepositRow } from "@/services/depositService";
import { managerService } from "@/services/managerService";
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
  const managers = useApi(managerService.fetch, president);
  const deposits = useApi(depositService.fetchAll, allowed);
  const rows = list?.data ?? [];
  const depositsByUser = new Map<number, DepositRow[]>();
  for (const deposit of deposits.data ?? []) {
    const bucket = depositsByUser.get(deposit.user_id) ?? [];
    bucket.push(deposit);
    depositsByUser.set(deposit.user_id, bucket);
  }
  const month = managers.data?.month ?? "";
  const assigned = new Map((managers.data?.data ?? []).map((row) => [row.user_id, row.id]));
  const [managerError, setManagerError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LaravelUser | null>(null);

  useEffect(() => {
    if (!allowed) {
      setListLoading(false);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    memberService
      .fetch(filters)
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
  }, [allowed, filters, refreshKey]);

  function patchFilters(partial: Partial<MemberFilters>, resetPage = true) {
    setFilters((current) => ({
      ...current,
      ...partial,
      offset: resetPage ? 0 : (partial.offset ?? current.offset ?? 0),
    }));
  }

  async function toggleManager(userId: number, assignmentId?: number) {
    if (!month) return;
    setManagerError(null);
    try {
      if (assignmentId) {
        await managerService.remove(assignmentId);
      } else {
        await managerService.assign(userId, month);
      }
      managers.reload();
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setManagerError(err instanceof Error ? err.message : "Could not update the manager.");
    }
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
              ? month
                ? `People seated in this mess. Managers for ${month}: ${managers.data?.count ?? 0} of ${managers.data?.max ?? 2}.`
                : "People seated in this mess. Assign up to two managers for the month from the action column."
              : "People in this mess. Adding a member or assigning a manager stays with the president."
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
      {managerError ? <Notice>{managerError}</Notice> : null}
      {deposits.error ? <Notice>{deposits.error}</Notice> : null}
      {listLoading ? <div className="h-64 animate-pulse rounded-2xl bg-white" /> : null}
      {!listLoading && !listError && rows.length === 0 ? (
        <EmptyState icon="users" title="No members yet" description="People added to this mess will show up here." />
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
          <div className="hidden grid-cols-12 gap-3 border-b border-stone-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400 md:grid">
            <div className={president ? "col-span-3" : "col-span-4"}>Name</div>
            <div className="col-span-2">Code</div>
            <div className="col-span-2">Room</div>
            <div className="col-span-2">Role</div>
            <div className={president ? "col-span-1" : "col-span-2"}>Status</div>
            {president ? <div className="col-span-2 text-right">Action</div> : null}
          </div>
          <ul>
            {rows.map((row) => (
              <li
                key={String(row.id)}
                className="grid grid-cols-1 gap-2 border-b border-stone-100 px-5 py-4 last:border-0 md:grid-cols-12 md:items-center md:gap-3"
              >
                <div className={`flex min-w-0 items-center gap-3 ${president ? "md:col-span-3" : "md:col-span-4"}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-900">
                    {initials(row.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-900">{row.name}</p>
                    <p className="truncate text-xs text-stone-500">{row.email}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 md:col-span-2">{row.member_code ?? "—"}</p>
                <p className="text-sm text-stone-600 md:col-span-2">{row.room_no ?? "—"}</p>
                <div className="md:col-span-2">
                  <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {roleLabel[row.role as Role] ?? row.role}
                  </span>
                </div>
                <div className={president ? "md:col-span-1" : "md:col-span-2"}>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-800">
                    {row.status ?? "active"}
                  </span>
                </div>
                {president ? (
                  <div className="flex items-center justify-end gap-2 md:col-span-2">
                    {row.role !== "president" ? (
                      <button
                        type="button"
                        disabled={!assigned.has(Number(row.id)) && (managers.data?.count ?? 0) >= 2}
                        onClick={() =>
                          void toggleManager(Number(row.id), assigned.get(Number(row.id)))
                        }
                        className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                      >
                        {assigned.has(Number(row.id)) ? "Remove manager" : "Make manager"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
                      aria-label={`Edit ${row.name}`}
                      title="Edit"
                    >
                      <Icon name="pencil" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <div className="md:col-span-12">
                  <MemberDeposits rows={depositsByUser.get(Number(row.id)) ?? []} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
      <MemberPager
        count={list?.count ?? 0}
        limit={list?.limit ?? filters.limit ?? 10}
        offset={list?.offset ?? filters.offset ?? 0}
        onOffset={(offset) => patchFilters({ offset }, false)}
      />
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
      await memberService.create({
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
    <Dialog title="Add member" onClose={onClose}>
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
          <input name="password" type="password" required minLength={8} className={fieldClass} />
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
      await memberService.update({
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
    <Dialog title="Edit member" onClose={onClose}>
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

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-stone-500 hover:text-stone-800">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
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

function MemberPager({
  count,
  limit,
  offset,
  onOffset,
}: {
  count: number;
  limit: number;
  offset: number;
  onOffset: (offset: number) => void;
}) {
  const from = count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, count);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
      <p>
        {from}–{to} of {count}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={offset <= 0}
          onClick={() => onOffset(Math.max(0, offset - limit))}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 font-medium disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={offset + limit >= count}
          onClick={() => onOffset(offset + limit)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
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

const fieldClass = "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 disabled:bg-stone-50";
