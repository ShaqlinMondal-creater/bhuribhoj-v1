"use client";

import {
  CalendarDays,
  Check,
  CircleDollarSign,
  CookingPot,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { hasFullAccess, roleLabels } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import type { Meal, GuestMeal } from "@/types/meal";
import type { Expense } from "@/types/expense";
import type { PublicUser } from "@/types/user";
import type { Mess } from "@/types/mess";
import type { Settings } from "@/types/settings";
import { createUser, deleteUser, updateUser } from "@/services/userService";
import { addMeal, cancelMeal } from "@/services/mealService";
import { addGuestMeal, cancelGuestMeal, updateGuestMeal } from "@/services/guestMealService";
import { addExpense, deleteExpense, updateExpense } from "@/services/expenseService";
import { updateMess } from "@/services/messService";
import { resetFromServer } from "@/data/memoryStore";

import { formatCurrency } from "@/lib/formatters";
import { ExpenseForm, FormModal, GuestMealForm, MealForm, UserForm } from "@/components/dashboard/PrototypeForms";
import type { UserFormValue } from "@/components/dashboard/PrototypeForms";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

type ViewData = {
  user: AuthenticatedUser;
  /** The users who carry a member_id, which is what a meal can be booked to. */
  members: PublicUser[];
  /** Every user, which is the one table the admin panel shows. */
  users: PublicUser[];
  mess: Mess;
  settings: Settings;
  meals: Meal[];
  guestMeals: GuestMeal[];
  expenses: Expense[];
  todayLunch: number;
  todayDinner: number;
  fixedExpenses: number;
  marketExpenses: number;
};

const currency = formatCurrency;
const roleClass = (role: string) => `role-badge role-${role}`;

/** Shows a value, or a dash when the field is null. */
const show = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const statusLabel = (status: boolean) => (status ? "active" : "inactive");

// A meal stores a member_id, so a name is found through the user that carries it.
const memberName = (members: PublicUser[], memberId: string) =>
  members.find((member) => member.member_id === memberId)?.name ?? memberId;

// Every write below goes to the server, which updates the JSON file. The UI
// reports success only after that write resolves, and turns a failure into a
// visible message instead of silently pretending the record was saved.
const runWrite = async (
  action: () => Promise<unknown>,
  setMessage: (text: string) => void,
): Promise<boolean> => {
  try {
    await action();
    return true;
  } catch (error) {
    setMessage(`Not saved: ${error instanceof Error ? error.message : "the data service rejected this change."}`);
    return false;
  }
};

export function WorkspaceView({ view, data }: { view: string; data: ViewData }) {
  const fullAccess = hasFullAccess(data.user.role);
  if (view === "Users") return <UsersView data={data} fullAccess={fullAccess} />;
  if (view === "Meals") return <MealsView data={data} />;
  if (view === "Guest Meals") return <GuestMealsView data={data} />;
  if (view === "Expenses" || view === "Expense Summary") return <ExpensesView data={data} />;
  if (view === "My Details") return <MyDetailsView data={data} />;
  if (view === "Reports") return <ReportsView data={data} />;
  if (view === "Settings") return <SettingsView data={data} fullAccess={fullAccess} />;
  return <PlaceholderView title={view} fullAccess={fullAccess} />;
}

// THE ONE USERS TABLE.
//
// Every person is a row here, whichever role they hold, and a member is simply a
// user whose member_id is set. This replaces the old members table, and the
// separate users listing that used to sit underneath it, so there is a single
// directory with search, filters, pagination and full-access actions.
function UsersView({ data, fullAccess }: { data: ViewData; fullAccess: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [formUser, setFormUser] = useState<PublicUser | "new" | null>(null);
  const [previewUser, setPreviewUser] = useState<PublicUser | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.users.filter((user) => {
      // The fields worth searching are the ones a person would be recognised by.
      const matchesQuery =
        needle === "" ||
        `${user.name} ${user.email} ${user.mobile ?? ""} ${user.member_id ?? ""} ${user.id}`
          .toLowerCase()
          .includes(needle);
      return (
        matchesQuery &&
        (status === "all" || statusLabel(user.status) === status) &&
        (role === "all" || user.role === role)
      );
    });
  }, [data.users, query, role, status]);

  // The member-subset count feeds the entry-fee card, because an entry fee is
  // something only a member carries.
  const memberRows = data.users.filter((user) => user.member_id !== null);
  const feePending = memberRows.filter((user) => user.entryFeeStatus === "pending").length;

  // Filtering or searching narrows the list, so a page beyond the new last page
  // would show an empty table. Falling back to page 1 keeps the table honest.
  const lastPage = Math.max(1, Math.ceil(filtered.length / 10));
  const visiblePage = Math.min(page, lastPage);

  const saveUser = async (value: UserFormValue) => {
    const ok = await runWrite(async () => {
      if (formUser === "new") {
        // createUser requires the password, and the server hashes it.
        await createUser(value);
      } else if (formUser) {
        // The password is not part of an update, so it never reaches the server here.
        await updateUser(formUser.id, value);
      }
    }, setMessage);
    if (!ok) return;
    setFormUser(null);
    setMessage("User saved successfully.");
  };

  const removeUser = async (user: PublicUser) => {
    const ok = await runWrite(() => deleteUser(user.id), setMessage);
    if (ok) setMessage(`${user.name} removed.`);
  };

  const toggleStatus = async (user: PublicUser) => {
    const next = !user.status;
    const ok = await runWrite(() => updateUser(user.id, { status: next }), setMessage);
    if (ok) setMessage(`${user.name} marked ${statusLabel(next)}.`);
  };

  // A member manages nobody. The navigation already keeps this view away from
  // them, and this is the second gate, so the table cannot be reached by any
  // other route into it.
  if (!fullAccess) {
    return <section className="content-panel placeholder-panel"><div className="placeholder-icon"><Sparkles size={22} /></div><h2>Users</h2><p>Your account can view its own details from &ldquo;My Details&rdquo;. Managing users is limited to admin, president and manager roles.</p></section>;
  }

  return <div className="workspace-view">
    <section className="view-summary-grid"><SummaryCard label="Total users" value={String(data.users.length)} icon={<Users size={18} />} /><SummaryCard label="Active users" value={String(data.users.filter((user) => user.status).length)} icon={<Check size={18} />} /><SummaryCard label="Entry fee pending" value={String(feePending)} icon={<CircleDollarSign size={18} />} /></section>
    <section className="content-panel directory-panel">
      <div className="filter-bar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, email, mobile or member ID" aria-label="Search users" /></div><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} aria-label="Filter by role"><option value="all">All roles</option><option value="admin">Admin</option><option value="president">President</option><option value="manager">Manager</option><option value="member">Member</option></select><button className="primary-button compact-button" onClick={() => setFormUser("new")}><Users size={15} /> Add user</button></div>
      {message && <p className="success-message" role="status">{message}</p>}
      {filtered.length === 0 ? <EmptyState message="No users match these filters." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>User</th><th>Member ID</th><th>Mobile</th><th>Room</th><th>Role</th><th>Status</th><th>Joining date</th><th>Entry fee</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.slice((visiblePage - 1) * 10, visiblePage * 10).map((user) => <tr key={user.id}><td><div className="person-cell"><div className="table-avatar">{user.image_url ? <Image src={user.image_url} alt="" width={31} height={31} unoptimized /> : user.name.charAt(0)}</div><div><strong>{user.name}</strong><span>{user.id} · {show(user.email)}</span></div></div></td><td>{show(user.member_id)}</td><td>{show(user.mobile)}</td><td>{show(user.room)}</td><td><span className={roleClass(user.role)}>{roleLabels[user.role]}</span></td><td><span className={`status-badge status-${statusLabel(user.status)}`}>{statusLabel(user.status)}</span></td><td>{show(user.joiningDate)}</td><td>{user.entryFeeStatus ? <span className={`fee-badge fee-${user.entryFeeStatus}`}>{user.entryFeeStatus === "paid" ? "Paid" : "Pending"}</span> : show(null)}</td><td><div className="row-actions"><button className="table-action" onClick={() => setPreviewUser(user)} aria-label={`Preview ${user.name}`}>Preview</button><button className="table-action" onClick={() => setFormUser(user)} aria-label={`Edit ${user.name}`}>Edit</button><button className="table-action" onClick={() => toggleStatus(user)} disabled={!user.status}>Deactivate</button>{user.id !== data.user.id && <button className="table-action" onClick={() => removeUser(user)} aria-label={`Remove ${user.name}`}>Delete</button>}</div></td></tr>)}</tbody></table></div>}
      <Pagination page={visiblePage} pageSize={10} total={filtered.length} onPageChange={setPage} />
    </section>
    {formUser && <FormModal title={formUser === "new" ? "Add user" : "Edit user"} onClose={() => setFormUser(null)}><UserForm user={formUser === "new" ? undefined : formUser} onClose={() => setFormUser(null)} onSave={saveUser} /></FormModal>}
    {previewUser && <UserPreview user={previewUser} onClose={() => setPreviewUser(null)} onEdit={() => { setFormUser(previewUser); setPreviewUser(null); }} />}
  </div>;
}

// A read-only look at one unified user record. Every field the record carries is
// listed, including the ones only a member has, and a field that is not set
// shows a dash rather than the word null. The password is not part of a public
// user, so there is nothing here that could leak one.
function UserPreview({ user, onClose, onEdit }: { user: PublicUser; onClose: () => void; onEdit: () => void }) {
  return <FormModal title={`${user.name} · preview`} eyebrow="Unified user record" onClose={onClose}><div className="detail-list user-preview-list"><Detail label="id" value={show(user.id)} /><Detail label="member_id" value={show(user.member_id)} /><Detail label="name" value={show(user.name)} /><Detail label="email" value={show(user.email)} /><Detail label="mobile" value={show(user.mobile)} /><Detail label="address" value={show(user.address)} /><Detail label="room" value={show(user.room)} /><Detail label="joiningDate" value={show(user.joiningDate)} /><Detail label="status" value={statusLabel(user.status)} /><Detail label="role" value={roleLabels[user.role]} /><Detail label="wallet_id" value={user.wallet_id === null ? "—" : String(user.wallet_id)} /><Detail label="deposite_amount" value={user.deposite_amount === null ? "—" : currency(user.deposite_amount)} /><Detail label="entryFee" value={user.entryFee === null ? "—" : currency(user.entryFee)} /><Detail label="entryFeeStatus" value={show(user.entryFeeStatus)} /><Detail label="entryFeePaidDate" value={show(user.entryFeePaidDate)} /><Detail label="image_url" value={show(user.image_url)} /><Detail label="login_status" value={user.login_status ? "signed in" : "signed out"} /><Detail label="login_at" value={show(user.login_at)} /><Detail label="logout_at" value={show(user.logout_at)} /></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button><button type="button" className="primary-button" onClick={onEdit}>Edit user</button></div></FormModal>;
}

function MealsView({ data }: { data: ViewData }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const records = [...data.meals].sort((a, b) => b.date.localeCompare(a.date));
    return <DataPanel title="Personal meals" caption="Lunch and dinner only" icon={<CookingPot size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add meal</button> : undefined}><div className="meal-summary"><span>Lunch today <strong>{data.todayLunch}</strong></span><span>Dinner today <strong>{data.todayDinner}</strong></span><span>Total today <strong>{data.todayLunch + data.todayDinner}</strong></span></div>{message && <p className="success-message">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Member</th><th>Meal</th><th>Status</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{records.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(data.members, meal.memberId)}</td><td><span className={`meal-badge ${meal.mealType}`}>{meal.mealType}</span></td><td><span className={`status-badge status-${meal.status === "taken" ? "active" : "inactive"}`}>{meal.status}</span></td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelMeal(meal.id, data.user.role, data.user.member_id ?? undefined), setMessage); if (ok) setMessage("Meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={records.length} onPageChange={setPage} />{showForm && <FormModal title="Add meal" onClose={() => setShowForm(false)}><MealForm members={data.members} user={data.user} onClose={() => setShowForm(false)} onSave={async (value) => { const ok = await runWrite(() => addMeal(value, data.user.role, data.user.member_id ?? undefined), setMessage); if (!ok) return; setShowForm(false); setMessage("Meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function GuestMealsView({ data }: { data: ViewData }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GuestMeal | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
    return <DataPanel title="Guest meals" caption="Separate from personal lunch and dinner" icon={<CalendarDays size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add guest meal</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Added by</th><th>Guest</th><th>Thali</th><th>Price</th><th>Status</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{data.guestMeals.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(data.members, meal.memberId)}</td><td>{meal.guestName}</td><td className="title-case">{meal.thaliType.replace("-", " ")}</td><td className="amount-cell">{formatCurrency(meal.price)}</td><td><span className={`status-badge status-${meal.status === "confirmed" ? "active" : "inactive"}`}>{meal.status}</span></td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={() => setEditing(meal)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelGuestMeal(meal.id, data.user.role, data.user.member_id ?? undefined), setMessage); if (ok) setMessage("Guest meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={data.guestMeals.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit guest meal" : "Add guest meal"} onClose={() => { setShowForm(false); setEditing(null); }}><GuestMealForm members={data.members} user={data.user} meal={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateGuestMeal(editing.id, value, data.user.role, data.user.member_id ?? undefined); else await addGuestMeal(value, data.user.role, data.user.member_id ?? undefined); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Guest meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function ExpensesView({ data }: { data: ViewData }) {
  const total = data.fixedExpenses + data.marketExpenses;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Monthly expenses" value={currency(total)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Fixed expenses" value={currency(data.fixedExpenses)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Market / bazar" value={currency(data.marketExpenses)} icon={<CookingPot size={18} />} /></section><DataPanel title="Expense register" caption="Demo records only · no distribution formula" icon={<CircleDollarSign size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add expense</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Category</th><th>Type</th><th>Amount</th><th>Description</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{data.expenses.slice((page - 1) * 10, page * 10).map((expense) => <tr key={expense.id}><td>{expense.date}</td><td>{expense.category}</td><td><span className={`expense-type expense-${expense.type}`}>{expense.type === "market" ? "Market / Bazar" : "Fixed"}</span></td><td className="amount-cell">{currency(expense.amount)}</td><td>{expense.note}</td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={() => setEditing(expense)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => deleteExpense(expense.id, data.user.role), setMessage); if (ok) setMessage("Expense deleted."); }}>Delete</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={data.expenses.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit expense" : "Add expense"} onClose={() => { setShowForm(false); setEditing(null); }}><ExpenseForm expense={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateExpense(editing.id, value, data.user.role); else await addExpense(value, data.user.role); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Expense saved successfully."); }} /></FormModal>}</DataPanel></div>;
}

// A member's own panel. It reads the signed-in user, so it can only ever show
// that person, and every field is the unified user record, including the ones
// that only exist for some roles.
function MyDetailsView({ data }: { data: ViewData }) {
  const user = data.users.find((item) => item.id === data.user.id) ?? data.user;
  return <section className="details-grid"><div className="content-panel detail-hero"><div className="large-avatar">{user.name.charAt(0)}</div><h2>{user.name}</h2><p>{user.email}</p><span className={roleClass(user.role)}>{roleLabels[user.role]}</span></div><div className="content-panel detail-list"><Detail label="User ID" value={user.id} /><Detail label="Member ID" value={show(user.member_id)} /><Detail label="Mobile" value={show(user.mobile)} /><Detail label="Address" value={show(user.address)} /><Detail label="Room" value={show(user.room)} /><Detail label="Joining date" value={show(user.joiningDate)} /><Detail label="Status" value={statusLabel(user.status)} /><Detail label="Wallet ID" value={show(user.wallet_id)} /><Detail label="Deposit amount" value={user.deposite_amount === null ? "—" : currency(user.deposite_amount)} /><Detail label="Entry fee" value={user.entryFee === null ? "—" : currency(user.entryFee)} /><Detail label="Entry fee status" value={show(user.entryFeeStatus)} /><Detail label="Entry fee paid date" value={show(user.entryFeePaidDate)} /><Detail label="Last sign-in" value={show(user.login_at)} /><Detail label="Last sign-out" value={show(user.logout_at)} /></div></section>;
}

function ReportsView({ data }: { data: ViewData }) {
  // A meal is stored against a member_id, so the count joins on that field.
  const mealByMember = data.members.map((member) => ({
    member,
    count: data.meals.filter(
      (meal) => member.member_id !== null && meal.memberId === member.member_id && meal.status === "taken",
    ).length,
  }));
  const latestDate = (memberId: string | null) =>
    memberId === null
      ? "-"
      : data.meals
          .filter((meal) => meal.memberId === memberId)
          .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? "-";
  const [page, setPage] = useState(1);
  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Daily meals" value={String(data.todayLunch + data.todayDinner)} icon={<CookingPot size={18} />} /><SummaryCard label="Guest report" value={String(data.guestMeals.length)} icon={<CalendarDays size={18} />} /><SummaryCard label="Expense report" value={currency(data.fixedExpenses + data.marketExpenses)} icon={<CircleDollarSign size={18} />} /></section><DataPanel title="Member meal history" caption="Raw meal records · no settlement formula" icon={<Users size={19} />}><div className="table-scroll"><table className="data-table"><thead><tr><th>Member</th><th>Personal meals</th><th>Latest date</th></tr></thead><tbody>{mealByMember.slice((page - 1) * 10, page * 10).map(({ member, count }) => <tr key={member.id}><td>{member.name}</td><td>{count}</td><td>{latestDate(member.member_id)}</td></tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={mealByMember.length} onPageChange={setPage} /></DataPanel></div>;
}

function SettingsView({ data, fullAccess }: { data: ViewData; fullAccess: boolean }) {
  const [messName, setMessName] = useState(data.mess.name);
  const [message, setMessage] = useState("");
  const save = async () => { const ok = await runWrite(() => updateMess({ name: messName }, data.user.role), setMessage); if (ok) setMessage("Mess settings saved to mess.json."); };
  const reset = async () => { if (window.confirm("Reset BhuriBhoj demo data to the original seed?")) { const ok = await runWrite(() => resetFromServer(), setMessage); if (ok) setMessage("Demo data restored from the seed files."); } };
  return <div className="settings-grid"><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Mess profile</span><h3>Current workspace</h3></div><SettingsIcon /></div><label className="form-field">Mess name<input className="form-input" value={messName} onChange={(event) => setMessName(event.target.value)} disabled={!fullAccess} /></label><div className="setting-line"><span>Address</span><strong>{data.mess.address}</strong></div><div className="setting-line"><span>Contact</span><strong>{data.mess.contactEmail}</strong></div>{fullAccess && <button className="primary-button compact-button" onClick={save}>Save mess settings</button>}</section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Configuration</span><h3>Guest thali prices</h3></div><CircleDollarSign size={19} /></div>{Object.entries(data.settings.guestThaliPrices).map(([name, price]) => <div className="setting-line" key={name}><span className="title-case">{name.replace("-", " ")}</span><strong>{formatCurrency(price)}</strong></div>)}<p className="settings-note">Prices are centralized prototype settings. Billing rules are not implemented.</p></section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Prototype tools</span><h3>Data reset</h3></div><Sparkles size={19} /></div><p className="settings-note">Restore users, meals, guest meals, expenses, mess, and settings from the original JSON seed.</p><button className="secondary-button" onClick={reset}>Reset demo data</button>{message && <p className="success-message">{message}</p>}</section></div>;
}

function SettingsIcon() { return <span className="placeholder-spark">⚙</span>; }

function DataPanel({ title, caption, icon, action, children }: { title: string; caption: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) { return <section className="content-panel data-panel"><div className="panel-header"><div><span className="panel-eyebrow">{caption}</span><h3>{title}</h3></div><div className="panel-actions">{action}{icon}</div></div>{children}</section>; }
function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <article className="stat-card view-summary-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>; }
function PlaceholderView({ title, fullAccess }: { title: string; fullAccess: boolean }) { return <section className="content-panel placeholder-panel"><div className="placeholder-icon"><Sparkles size={22} /></div><h2>{title} view</h2><p>This workspace area is ready for its next feature milestone. {fullAccess ? "Management access is enabled for your role." : "Your account can view shared information here."}</p></section>; }