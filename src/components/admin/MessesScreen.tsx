"use client";

import { useEffect, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterDate, FilterSearch, MaterialScope } from "@/components/ui/FilterBar";
import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { inr } from "@/lib/format";
import { memberService } from "@/services/memberService";
import {
  messService,
  type AdminMess,
  type GuestMealSetup,
  type MessWrite,
} from "@/services/messService";
import { userService, type PlatformUser } from "@/services/userService";
import type { FundType } from "@/lib/api/mess";

type OpenState =
  | { mode: "create" }
  | { mode: "detail"; mess: AdminMess }
  | { mode: "edit"; mess: AdminMess }
  | { mode: "assign"; mess: AdminMess }
  | { mode: "delete"; mess: AdminMess };

export function MessesScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminMess[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    messService
      .fetch({ limit: 100, offset: 0 })
      .then((payload) => {
        if (cancelled) return;
        const all = normalizeMesses(payload);
        const filtered = search
          ? all.filter((mess) =>
              [mess.name, mess.code, mess.district, mess.address, mess.email, mess.contact_no]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search)),
            )
          : all;
        setCount(filtered.length);
        setRows(filtered.slice(offset, offset + limit));
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load messes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, limit, offset, reloadKey]);

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="Mess Details" title="Messes" description="Create, edit, assign seats, and guest meal prices for every mess." />
        <button
          type="button"
          onClick={() => setOpen({ mode: "create" })}
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add mess
        </button>
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}

      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Name, code, district, or contact" />
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
            <th className={thClass()}>Mess</th>
            <th className={thClass()}>Leaders</th>
            <th className={thClass()}>Guest meals</th>
            <th className={thClass()}>Address</th>
            <th className={thClass()}>Status</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={6}
          loading={loading && rows.length === 0}
          empty={!loading && rows.length === 0 ? (search ? "No messes match this search." : "No messes yet.") : null}
        />
        {rows.map((mess) => (
          <tr key={mess.id} className={rowClass}>
            <td className="px-4 py-3">
              <p className="font-medium text-stone-950">{mess.name}</p>
              <p className="text-xs text-stone-500">{mess.code}</p>
            </td>
            <td className="px-4 py-3 text-sm text-stone-700">
              <p>P · {mess.president_user?.name ?? "—"}</p>
              <p className="text-xs text-stone-500">M · {mess.manager_user?.name ?? "—"}</p>
            </td>
            <td className="px-4 py-3 text-sm text-stone-700">
              {(mess.guest_meal_setups ?? []).length === 0 ? (
                "—"
              ) : (
                <span className="line-clamp-2">
                  {(mess.guest_meal_setups ?? []).map((row) => `${row.meal_name} ${inr(Number(row.price))}`).join(" · ")}
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-stone-600">
              {mess.address}, {mess.district} {mess.pincode}
            </td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${mess.is_active ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-stone-100 text-stone-500"}`}>
                {mess.is_active ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <IconButton label="Detail" icon="eye" onClick={() => setOpen({ mode: "detail", mess })} />
                <IconButton label="Edit" icon="pencil" onClick={() => setOpen({ mode: "edit", mess })} />
                <IconButton label="Assign" icon="users" onClick={() => setOpen({ mode: "assign", mess })} />
                <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", mess })} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {open?.mode === "create" ? (
        <CreateDialog
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "detail" ? <DetailDialog mess={open.mess} onClose={() => setOpen(null)} /> : null}
      {open?.mode === "edit" ? (
        <EditDialog
          mess={open.mess}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onGuestChanged={refresh}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "assign" ? (
        <AssignDialog
          mess={open.mess}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "delete" ? (
        <DeleteDialog
          mess={open.mess}
          onClose={() => setOpen(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else refresh();
          }}
          onFailed={(message) => {
            setError(message);
            setOpen(null);
          }}
        />
      ) : null}
    </section>
  );
}

function CreateDialog({
  onClose,
  onSaved,
  onFailed,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [fundType, setFundType] = useState<FundType>("manager_only");
  const [presidentId, setPresidentId] = useState("");
  const [candidates, setCandidates] = useState<PlatformUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.fetch({ role: "president", status: "active", limit: 100, offset: 0 }),
      userService.fetch({ role: "member", status: "active", limit: 100, offset: 0 }),
    ])
      .then(([presidents, members]) => {
        if (cancelled) return;
        const rows = [...(presidents.data ?? []), ...(members.data ?? [])].filter((user) => !user.mess);
        setCandidates(rows);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const body = readMessWrite(data, fundType);
      const result = await messService.adminOpen({
        ...body,
        president_user_id: presidentId ? Number(presidentId) : null,
      });
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not create the mess.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Add mess" onClose={onClose}>
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
          <MessFields fundType={fundType} onFundType={setFundType} />
          <TextField
            select
            fullWidth
            label="President (optional)"
            value={presidentId}
            onChange={(event) => setPresidentId(event.target.value)}
            helperText="Only people who are not already in a mess."
          >
            <MenuItem value="">None yet</MenuItem>
            {candidates.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.name} · {user.email}
              </MenuItem>
            ))}
          </TextField>
          <button type="submit" disabled={pending} className="mt-2 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Creating…" : "Create mess"}
          </button>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function DetailDialog({ mess, onClose }: { mess: AdminMess; onClose: () => void }) {
  const guest = mess.guest_meal_setups ?? [];
  const rows: Array<[string, string]> = [
    ["Name", mess.name],
    ["Code", mess.code],
    ["Address", `${mess.address}, ${mess.district} ${mess.pincode}`],
    ["Contact", mess.contact_no || "—"],
    ["Email", mess.email || "—"],
    ["Fund", mess.fund_type === "mess_and_manager" ? "Mess + manager" : "Manager only"],
    ["Monthly due", moneyOf(mess.monthly_due_amount)],
    ["Due day", mess.monthly_due_days != null ? String(mess.monthly_due_days) : "—"],
    ["Late fee", moneyOf(mess.late_fee_amount)],
    ["Start deposit", moneyOf(mess.s_deposite_amount)],
    ["President", mess.president_user?.name ?? "—"],
    ["Manager", mess.manager_user?.name ?? "—"],
    ["Status", mess.is_active ? "Active" : "Inactive"],
    ["Subscription", mess.active_subscription?.plan?.name ?? mess.active_subscription?.status ?? "—"],
  ];

  return (
    <Dialog title="Mess detail" onClose={onClose}>
      <DetailList rows={rows} valueClassName="text-right font-medium text-stone-900" />
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-stone-950">Guest meal prices</h3>
        {guest.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No guest meals yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {guest.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-sm">
                <span className="font-medium text-stone-900">{row.meal_name}</span>
                <span className="text-stone-700">{inr(Number(row.price))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

function EditDialog({
  mess,
  onClose,
  onSaved,
  onGuestChanged,
  onFailed,
}: {
  mess: AdminMess;
  onClose: () => void;
  onSaved: (message: string) => void;
  onGuestChanged: () => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [fundType, setFundType] = useState<FundType>(mess.fund_type);
  const [active, setActive] = useState(mess.is_active);
  const [guest, setGuest] = useState<GuestMealSetup[]>(mess.guest_meal_setups ?? []);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestDone, setGuestDone] = useState<string | null>(null);

  async function reloadGuest() {
    const result = await messService.adminGuestMeals(mess.id);
    setGuest(result.data ?? []);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const body = readMessWrite(data, fundType);
      const result = await messService.adminUpdate(mess.id, { ...body, is_active: active });
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not update the mess.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Edit mess" onClose={onClose}>
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
          <MessFields
            fundType={fundType}
            onFundType={setFundType}
            defaults={{
              name: mess.name,
              address: mess.address,
              district: mess.district,
              pincode: mess.pincode,
              contact_no: mess.contact_no,
              email: mess.email ?? "",
              monthly_due_amount: String(mess.monthly_due_amount ?? 0),
              monthly_due_days: mess.monthly_due_days != null ? String(mess.monthly_due_days) : "",
              s_deposite_amount: mess.s_deposite_amount != null ? String(mess.s_deposite_amount) : "",
              late_fee_amount: String(mess.late_fee_amount ?? 0),
            }}
          />
          <TextField select fullWidth label="Status" value={active ? "active" : "inactive"} onChange={(event) => setActive(event.target.value === "active")}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <button type="submit" disabled={pending} className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Saving…" : "Save mess"}
          </button>
        </form>
      </MaterialScope>

      <div className="mt-5 border-t border-stone-200 pt-4">
        <h3 className="text-sm font-semibold text-stone-950">Guest meal prices</h3>
        <p className="mt-1 text-xs text-stone-500">Shown under this mess. Saves separately from the mess form.</p>
        <Flash message={guestDone} />
        {guestError ? <div className="mt-2"><Notice>{guestError}</Notice></div> : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {guest.map((row) => (
            <GuestMealEditor
              key={row.id}
              row={row}
              onChanged={async (message) => {
                setGuestDone(message);
                setGuestError(null);
                try {
                  await reloadGuest();
                  onGuestChanged();
                } catch (err) {
                  setGuestError(err instanceof Error ? err.message : "Could not refresh guest meals.");
                }
              }}
              onFailed={setGuestError}
              messId={mess.id}
            />
          ))}
          <GuestMealAdd
            messId={mess.id}
            onChanged={async (message) => {
              setGuestDone(message);
              setGuestError(null);
              try {
                await reloadGuest();
                onGuestChanged();
              } catch (err) {
                setGuestError(err instanceof Error ? err.message : "Could not refresh guest meals.");
              }
            }}
            onFailed={setGuestError}
          />
        </div>
      </div>
    </Dialog>
  );
}

function AssignDialog({
  mess,
  onClose,
  onSaved,
  onFailed,
}: {
  mess: AdminMess;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [members, setMembers] = useState<{ id: number; name: string; email: string; role: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [seat, setSeat] = useState<"president" | "manager">("manager");
  const [fromDate, setFromDate] = useState(() => todayDmy());
  const [toDate, setToDate] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    memberService
      .fetch("admin", { status: "active", limit: 100, offset: 0 }, mess.id)
      .then((result) => {
        if (cancelled) return;
        setMembers(
          (result.data ?? []).map((user) => ({
            id: Number(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
          })),
        );
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load members.");
      });
    return () => {
      cancelled = true;
    };
  }, [mess.id]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDmy(fromDate)) {
      onFailed("Use dd-mm-yyyy for the start date.");
      return;
    }
    if (toDate && !isDmy(toDate)) {
      onFailed("Use dd-mm-yyyy for the end date.");
      return;
    }
    setPending(true);
    try {
      const result = await messService.adminAssign(mess.id, {
        user_id: Number(userId),
        seat,
        from_date: fromDate,
        to_date: toDate || null,
      });
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not assign the seat.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Assign seat" onClose={onClose}>
      <p className="mb-3 text-sm text-stone-600">
        Assign a person who already belongs to <span className="font-medium text-stone-900">{mess.name}</span>.
      </p>
      {loadError ? <Notice>{loadError}</Notice> : null}
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3">
          <TextField select required fullWidth label="Person" value={userId} onChange={(event) => setUserId(event.target.value)}>
            <MenuItem value="" disabled>
              Choose a member
            </MenuItem>
            {members.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.name} · {user.role}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Seat" value={seat} onChange={(event) => setSeat(event.target.value as "president" | "manager")}>
            <MenuItem value="president">President</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
          </TextField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilterDate label="From" value={fromDate} onChange={setFromDate} />
            <FilterDate label="To (optional)" value={toDate} onChange={setToDate} />
          </div>
          <button type="submit" disabled={pending || !userId} className="mt-2 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Assigning…" : "Assign"}
          </button>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function DeleteDialog({
  mess,
  onClose,
  onDeleted,
  onFailed,
}: {
  mess: AdminMess;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await messService.adminRemove(mess.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the mess.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete mess" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete {mess.name}? People, deposits, and subscriptions must be removed first.
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

function GuestMealEditor({
  messId,
  row,
  onChanged,
  onFailed,
}: {
  messId: number;
  row: GuestMealSetup;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.meal_name);
  const [price, setPrice] = useState(String(row.price));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await messService.adminSaveGuestMeal(messId, {
        id: row.id,
        meal_name: name.trim(),
        price: Number(price),
      });
      setEditing(false);
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not save the guest meal.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    setPending(true);
    try {
      const result = await messService.adminRemoveGuestMeal(messId, row.id);
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the guest meal.");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={onSubmit} className="rounded-xl border border-[var(--accent)] bg-white p-3">
        <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full bg-transparent text-sm font-semibold outline-none" />
        <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="0.01" required className="mt-2 w-full bg-transparent text-lg font-semibold outline-none" />
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={pending} className="text-xs font-semibold text-[var(--brand)] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setEditing(false); setName(row.meal_name); setPrice(String(row.price)); }} className="text-xs font-semibold text-stone-500">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-stone-950">{row.meal_name}</p>
          <p className="mt-1 text-lg font-semibold text-stone-900">{inr(Number(row.price))}</p>
        </div>
        <div className="flex">
          <IconButton label="Edit" icon="pencil" onClick={() => setEditing(true)} />
          <IconButton label="Delete" icon="trash" onClick={() => void onDelete()} />
        </div>
      </div>
    </article>
  );
}

function GuestMealAdd({
  messId,
  onChanged,
  onFailed,
}: {
  messId: number;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const result = await messService.adminSaveGuestMeal(messId, {
        meal_name: String(data.get("meal_name") ?? ""),
        price: Number(data.get("price")),
      });
      form.reset();
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not add the guest meal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
      <div className="flex items-center gap-2">
        <Icon name="meals" className="h-4 w-4 text-emerald-800" />
        <input name="meal_name" required placeholder="Meal name" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-stone-400" />
        <button type="submit" disabled={pending} className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Add"}
        </button>
      </div>
      <input name="price" type="number" min="0" step="0.01" required placeholder="Price" className="mt-2 w-full bg-transparent text-lg font-semibold outline-none placeholder:text-stone-300" />
    </form>
  );
}

function MessFields({
  fundType,
  onFundType,
  defaults,
}: {
  fundType: FundType;
  onFundType: (value: FundType) => void;
  defaults?: {
    name?: string;
    address?: string;
    district?: string;
    pincode?: string;
    contact_no?: string;
    email?: string;
    monthly_due_amount?: string;
    monthly_due_days?: string;
    s_deposite_amount?: string;
    late_fee_amount?: string;
  };
}) {
  return (
    <>
      <TextField name="name" required fullWidth label="Name" defaultValue={defaults?.name ?? ""} />
      <TextField name="address" required fullWidth label="Address" defaultValue={defaults?.address ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="district" required fullWidth label="District" defaultValue={defaults?.district ?? ""} />
        <TextField name="pincode" required fullWidth label="Pincode" defaultValue={defaults?.pincode ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="contact_no" required fullWidth label="Contact" defaultValue={defaults?.contact_no ?? ""} />
        <TextField name="email" fullWidth type="email" label="Email" defaultValue={defaults?.email ?? ""} />
      </div>
      <TextField
        select
        fullWidth
        label="Fund type"
        value={fundType}
        onChange={(event) => onFundType(event.target.value as FundType)}
      >
        <MenuItem value="manager_only">Manager fund only</MenuItem>
        <MenuItem value="mess_and_manager">Mess fund and manager fund</MenuItem>
      </TextField>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="monthly_due_amount" required fullWidth type="number" slotProps={{ htmlInput: { min: 0, step: "0.01" } }} label="Monthly due (₹)" defaultValue={defaults?.monthly_due_amount ?? "0"} />
        <TextField name="monthly_due_days" fullWidth type="number" slotProps={{ htmlInput: { min: 1, max: 31 } }} label="Due day" defaultValue={defaults?.monthly_due_days ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="late_fee_amount" required fullWidth type="number" slotProps={{ htmlInput: { min: 0, step: "0.01" } }} label="Late fee (₹)" defaultValue={defaults?.late_fee_amount ?? "0"} />
        {fundType === "mess_and_manager" ? (
          <TextField name="s_deposite_amount" fullWidth type="number" slotProps={{ htmlInput: { min: 0, step: "0.01" } }} label="Start deposit (₹)" defaultValue={defaults?.s_deposite_amount ?? ""} />
        ) : null}
      </div>
    </>
  );
}

function readMessWrite(data: FormData, fundType: FundType): MessWrite {
  const dueDaysRaw = String(data.get("monthly_due_days") ?? "").trim();
  const depositRaw = String(data.get("s_deposite_amount") ?? "").trim();
  return {
    name: String(data.get("name") ?? "").trim(),
    address: String(data.get("address") ?? "").trim(),
    district: String(data.get("district") ?? "").trim(),
    pincode: String(data.get("pincode") ?? "").trim(),
    contact_no: String(data.get("contact_no") ?? "").trim(),
    email: String(data.get("email") ?? "").trim() || null,
    fund_type: fundType,
    monthly_due_amount: Number(data.get("monthly_due_amount") ?? 0),
    monthly_due_days: dueDaysRaw ? Number(dueDaysRaw) : null,
    s_deposite_amount: fundType === "mess_and_manager" && depositRaw !== "" ? Number(depositRaw) : null,
    late_fee_amount: Number(data.get("late_fee_amount") ?? 0),
  };
}

function normalizeMesses(payload: { data?: AdminMess[] } | AdminMess | null): AdminMess[] {
  if (!payload) return [];
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("id" in payload) return [payload];
  return [];
}

function moneyOf(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return inr(Number(value));
}

function todayDmy() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  return `${day}-${month}-${year}`;
}

function isDmy(value: string) {
  return /^\d{2}-\d{2}-\d{4}$/.test(value);
}
