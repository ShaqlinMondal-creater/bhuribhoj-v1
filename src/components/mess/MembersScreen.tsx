"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { FilterAutocomplete, FilterBar, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import Checkbox from "@mui/material/Checkbox";
import IconButtonMui from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { isPresident, roleLabel, seatsLabel } from "@/lib/auth/roles";
import { inr, initials } from "@/lib/format";
import { depositService, type DepositRow } from "@/services/depositService";
import { memberService, type MemberFilters, type MemberSeats, type MembersPage } from "@/services/memberService";
import { messService } from "@/services/messService";
import type { LaravelUser, Role } from "@/types/auth";

type MemberRow = LaravelUser & { seats?: MemberSeats };

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
  const house = useApi(() => messService.house("president"), president);
  const monthlyDue = Number(house.data?.data?.monthly_due_amount ?? 0);
  const rows = list?.data ?? [];
  const depositsByUser = new Map<number, DepositRow[]>();
  for (const deposit of deposits.data ?? []) {
    const bucket = depositsByUser.get(deposit.user_id) ?? [];
    bucket.push(deposit);
    depositsByUser.set(deposit.user_id, bucket);
  }
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [viewing, setViewing] = useState<MemberRow | null>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const managerCount = list?.manager_count ?? 0;
  const managerLimit = list?.manager_limit ?? 3;

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
      <Flash message={notice} />
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
            <th className={thClass()}>Mess Fund</th>
            <th className={thClass()}>Manager Fund</th>
            <th className={thClass()}>Due Curr. Month</th>
            <th className={thClass()}>Due Prev Month</th>
            <th className={thClass("right")}>Action</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={10}
          loading={listLoading}
          empty={!listLoading && rows.length === 0 ? "No members yet." : null}
        />
        {rows.map((row) => {
          const memberDeposits = depositsByUser.get(Number(row.id)) ?? [];
          return (
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
            </td>
            <td className="px-4 py-3 align-top text-stone-600">{row.member_code ?? "—"}</td>
            <td className="px-4 py-3 align-top text-stone-600">{row.room_no ?? "—"}</td>
            <td className="px-4 py-3 align-top">
              <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                {seatsLabel(row.seats) ?? roleLabel[row.role as Role] ?? row.role}
              </span>
            </td>
            <td className="px-4 py-3 align-top">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--brand)]">
                {row.status ?? "active"}
              </span>
            </td>
            <td className="px-4 py-3 align-top font-medium text-stone-900">{president ? inr(fundSum(memberDeposits, "mess_fund")) : "—"}</td>
            <td className="px-4 py-3 align-top font-medium text-stone-900">{president ? inr(fundSum(memberDeposits, "manager_fund")) : "—"}</td>
            <td className="px-4 py-3 align-top font-medium text-red-600">{president ? inr(monthDue(memberDeposits, monthlyDue, 0)) : "—"}</td>
            <td className="px-4 py-3 align-top font-medium text-red-600">{president ? inr(monthDue(memberDeposits, monthlyDue, -1)) : "—"}</td>
            <td className="px-4 py-3 align-top">
              <div className="flex justify-end">
                <IconButton label={`View ${row.name}`} icon="eye" iconClassName="h-3.5 w-3.5" onClick={() => setViewing(row)} />
                {president ? (
                  <IconButton label={`Edit ${row.name}`} icon="pencil" iconClassName="h-3.5 w-3.5" onClick={() => setEditing(row)} />
                ) : null}
                {president && String(row.id) !== user.id && !row.seats?.president ? (
                  <IconButton label={`Delete ${row.name}`} icon="trash" iconClassName="h-3.5 w-3.5" onClick={() => setRemoving(row)} />
                ) : null}
              </div>
            </td>
          </tr>
          );
        })}
      </TableShell>

      {adding ? (
        <AddMemberDialog
          managerCount={managerCount}
          managerLimit={managerLimit}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      ) : null}
      {viewing ? (
        <MemberDetailDialog
          member={viewing}
          deposits={depositsByUser.get(Number(viewing.id)) ?? []}
          monthlyDue={monthlyDue}
          onClose={() => setViewing(null)}
        />
      ) : null}
      {editing ? (
        <EditMemberDialog
          member={editing}
          self={String(editing.id) === user.id}
          managerCount={managerCount}
          managerLimit={managerLimit}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            if (message) setNotice(message);
            setRefreshKey((value) => value + 1);
          }}
        />
      ) : null}
      {removing ? (
        <DeleteMemberDialog
          member={removing}
          onClose={() => setRemoving(null)}
          onDeleted={(message) => {
            setRemoving(null);
            setNotice(message);
            setListError(null);
            setRefreshKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setListError(message);
            setNotice(null);
            setRemoving(null);
          }}
        />
      ) : null}
    </section>
  );
}

function AddMemberDialog({
  onClose,
  onCreated,
  managerCount,
  managerLimit,
}: {
  onClose: () => void;
  onCreated: () => void;
  managerCount: number;
  managerLimit: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [asManager, setAsManager] = useState(false);
  const managerSlotsFull = managerCount >= managerLimit;

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
        manager: asManager,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the member.");
      setPending(false);
    }
  }

  return (
    <Dialog title="Add member" onClose={onClose} size="lg" backdrop="stone" closeClassName="text-sm font-medium text-stone-500 hover:text-stone-800">
      <MaterialScope>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <TextField name="name" label="Name" required fullWidth />
        <TextField name="email" label="Email" type="email" required fullWidth />
        <TextField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          fullWidth
          autoComplete="new-password"
          slotProps={{ htmlInput: { minLength: 8 }, input: { endAdornment: (
            <InputAdornment position="end">
              <IconButtonMui type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} size="small">
                {showPassword ? "Hide" : "Show"}
              </IconButtonMui>
            </InputAdornment>
          ) } }}
        />
        <TextField name="mobile" label="Mobile" fullWidth />
        <TextField name="room_no" label="Room" fullWidth className="sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm text-stone-800 sm:col-span-2">
          <input
            type="checkbox"
            checked={asManager}
            disabled={pending || managerSlotsFull}
            onChange={(event) => setAsManager(event.target.checked)}
          />
          Also give manager seat
          <span className="text-xs text-stone-500">({managerCount}/{managerLimit} used)</span>
        </label>
        {managerSlotsFull ? (
          <p className="text-xs text-amber-700 sm:col-span-2">Manager limit reached. Add as member only.</p>
        ) : null}
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
      </MaterialScope>
    </Dialog>
  );
}

function EditMemberDialog({
  member,
  self,
  managerCount,
  managerLimit,
  onClose,
  onSaved,
}: {
  member: MemberRow;
  self: boolean;
  managerCount: number;
  managerLimit: number;
  onClose: () => void;
  onSaved: (message?: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [seatRoles, setSeatRoles] = useState<Array<"manager" | "member">>(() => {
    const next: Array<"manager" | "member"> = ["member"];
    if (member.seats?.manager) next.unshift("manager");
    return next;
  });
  const isPresidentSeat = Boolean(member.seats?.president);
  const isManager = seatRoles.includes("manager");
  const managerSlotsFull = !isManager && managerCount >= managerLimit;

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

      const wasManager = Boolean(member.seats?.manager);
      if (isManager !== wasManager) {
        await memberService.seats("president", {
          user_id: Number(member.id),
          manager: isManager,
        });
      }

      onSaved("Member updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the member.");
      setPending(false);
    }
  }

  const roleLabelValue = [
    ...(isPresidentSeat ? ["President"] : []),
    ...seatRoles.map((seat) => (seat === "manager" ? "Manager" : "Member")),
  ].join(" · ");

  return (
    <Dialog title="Edit member" onClose={onClose} size="lg" backdrop="stone" closeClassName="text-sm font-medium text-stone-500 hover:text-stone-800">
      <MaterialScope>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="name" label="Name" required fullWidth defaultValue={member.name} />
          <TextField name="mobile" label="Mobile" fullWidth defaultValue={member.mobile ?? ""} />
        </div>
        <TextField name="email" label="Email" type="email" fullWidth value={member.email} disabled />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField name="room_no" label="Room" fullWidth defaultValue={member.room_no ?? ""} />
          <TextField name="status" label="Status" select fullWidth defaultValue={member.status ?? "active"} disabled={self}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Role"
            value={seatRoles}
            onChange={(event) => {
              const raw = event.target.value;
              const values = (typeof raw === "string" ? raw.split(",") : raw) as Array<"manager" | "member">;
              const next: Array<"manager" | "member"> = ["member"];
              if (values.includes("manager") && !(managerSlotsFull && !isManager)) next.unshift("manager");
              setSeatRoles(next);
            }}
            helperText={
              isPresidentSeat
                ? "President seat is set from Mess config only."
                : managerSlotsFull
                  ? `Manager limit reached (${managerCount}/${managerLimit}).`
                  : `Manager seats used: ${managerCount}/${managerLimit}`
            }
            slotProps={{
              select: {
                multiple: true,
                renderValue: () => roleLabelValue,
              },
            }}
          >
            <MenuItem value="manager" disabled={pending || (managerSlotsFull && !isManager)}>
              <Checkbox checked={isManager} size="small" />
              <ListItemText primary="Manager" />
            </MenuItem>
            <MenuItem value="member" disabled>
              <Checkbox checked size="small" />
              <ListItemText primary="Member" />
            </MenuItem>
          </TextField>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
      </MaterialScope>
    </Dialog>
  );
}

function DeleteMemberDialog({
  member,
  onClose,
  onDeleted,
  onFailed,
}: {
  member: LaravelUser;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await memberService.remove("president", Number(member.id));
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete member" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete <span className="font-semibold text-stone-900">{member.name}</span>
        {member.member_code ? ` (${member.member_code})` : ""}? Their meals and deposits for this mess will also be removed.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={pending}
          className="flex-1 rounded-full bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
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
    <FilterBar>
      <FilterSearch
        value={filters.search ?? ""}
        onChange={(search) => onChange({ search })}
        placeholder="Name, email, member id, code, or mobile"
      />
      <FilterAutocomplete
        label="Room"
        value={filters.room_no ?? ""}
        options={roomOptions}
        placeholder="Search a room"
        onChange={(room_no) => onChange({ room_no })}
      />
      <FilterSelect
        label="Role"
        value={filters.role ?? ""}
        onChange={(role) => onChange({ role: role as MemberFilters["role"] })}
        options={[
          { value: "", label: "All roles" },
          { value: "president", label: "President" },
          { value: "manager", label: "Manager" },
          { value: "member", label: "Member" },
        ]}
      />
      <FilterSelect
        label="Status"
        value={filters.status ?? ""}
        onChange={(status) => onChange({ status: status as MemberFilters["status"] })}
        options={[
          { value: "", label: "All" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />
    </FilterBar>
  );
}

function MemberDetailDialog({
  member,
  deposits,
  monthlyDue,
  onClose,
}: {
  member: LaravelUser;
  deposits: DepositRow[];
  monthlyDue: number;
  onClose: () => void;
}) {
  const lines: Array<[string, string]> = [
    ["Name", member.name],
    ["Email", member.email],
    ["Mobile", member.mobile || "—"],
    ["Code", member.member_code || "—"],
    ["Room", member.room_no || "—"],
    ["Role", seatsLabel(member.seats) ?? roleLabel[member.role as Role] ?? member.role],
    ["Status", member.status ?? "active"],
    ["Mess fund", inr(fundSum(deposits, "mess_fund"))],
    ["Manager fund", inr(fundSum(deposits, "manager_fund"))],
  ];

  return (
    <Dialog title="Member detail" onClose={onClose} size="lg" backdrop="stone">
      <DetailList rows={lines} />
      <p className="mt-4 text-sm font-medium text-red-600">Due Curr. Month {inr(monthDue(deposits, monthlyDue, 0))}</p>
      <p className="mt-1 text-sm font-medium text-red-600">Due Prev Month {inr(monthDue(deposits, monthlyDue, -1))}</p>
    </Dialog>
  );
}

function fundSum(rows: DepositRow[], fund: string) {
  return rows.reduce((sum, row) => sum + (row.fund_type === fund ? Number(row.amount) : 0), 0);
}

function monthDue(rows: DepositRow[], monthlyDue: number, offset: number) {
  const key = kolkataMonth(offset);
  const paid = rows.reduce((sum, row) => {
    if (row.fund_type !== "manager_fund") return sum;
    const month = monthKey(row.for_month) || monthKey(row.deposited_on);
    return month === key ? sum + Number(row.amount) : sum;
  }, 0);
  return Math.max(0, monthlyDue - paid);
}

function kolkataMonth(offset: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "2026");
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKey(value: string | null | undefined) {
  const match = String(value ?? "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}`;
}
