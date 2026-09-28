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
import { createUser, deleteUser, findUserById, updateUser } from "@/services/userService";
import { addMeal, cancelMeal } from "@/services/mealService";
import { addGuestMeal, cancelGuestMeal, updateGuestMeal } from "@/services/guestMealService";
import { addExpense, deleteExpense, updateExpense } from "@/services/expenseService";
import { updateMess } from "@/services/messService";
import { resetFromServer } from "@/data/memoryStore";
import { useCollection } from "@/hooks/useCollection";
import { useMembers, useUsersPage } from "@/hooks/useUsersPage";

import { getTodayDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { ExpenseForm, FormModal, GuestMealForm, MealForm, UserForm } from "@/components/dashboard/PrototypeForms";
import type { UserFormValue } from "@/components/dashboard/PrototypeForms";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

// EVERY VIEW FETCHES ITS OWN DATA.
//
// A view mounts when it is opened, and mounting it is what asks the server for
// what that view shows. Meals are not requested by the dashboard, users are not
// requested by the shell, and opening one view never brings another along. The
// mess and settings documents arrive with the shell and are handed down here
// rather than being fetched twice.

type ViewProps = {
  user: AuthenticatedUser;
  /** Already loaded by the shell, so the Settings view costs no request. */
  mess: Mess;
  settings: Settings;
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

const isLoading = (status: string) => status === "loading" || status === "idle";

// A member sees only their own meals and guest meals, found through the
// member_id their record carries. Someone with no member_id keeps the whole view.
const scopedTo = <T extends { memberId: string }>(rows: T[], memberId: string | null) =>
  memberId ? rows.filter((row) => row.memberId === memberId) : rows;

export function WorkspaceView({ view, ...rest }: { view: string } & ViewProps) {
  const { user } = rest;
  const fullAccess = hasFullAccess(user.role);
  if (view === "Users") return <UsersView user={user} fullAccess={fullAccess} />;
  if (view === "Meals") return <MealsView user={user} />;
  if (view === "Guest Meals") return <GuestMealsView user={user} />;
  if (view === "Expenses" || view === "Expense Summary") return <ExpensesView user={user} />;
  if (view === "My Details") return <MyDetailsView user={user} />;
  if (view === "Reports") return <ReportsView user={user} />;
  if (view === "Settings") return <SettingsView {...rest} fullAccess={fullAccess} />;
  return <PlaceholderView title={view} fullAccess={fullAccess} />;
}

// THE ONE USERS TABLE.
//
// Every person is a row here, whichever role they hold, and a member is simply a
// user whose member_id is set. This replaces the old members table, and the
// separate users listing that used to sit underneath it, so there is a single
// directory with search, filters, pagination and full-access actions.
//
// Nothing is filtered in this file. The search box, the two dropdowns and the
// pager are each one request, and the rows that arrive are the rows on screen.
function UsersView({ user, fullAccess }: { user: AuthenticatedUser; fullAccess: boolean }) {
  // A member never gets here through the navigation, and the request is gated on
  // the same test, so no member ever pulls the directory down.
  const page = useUsersPage(fullAccess);
  const [formUser, setFormUser] = useState<PublicUser | "new" | null>(null);
  const [previewUser, setPreviewUser] = useState<PublicUser | null>(null);
  const [message, setMessage] = useState("");

  // Filtering or searching narrows the list, so a page beyond the new last page
  // would show an empty table. Falling back to page 1 keeps the table honest.
  const visiblePage = Math.min(page.page, page.lastPage);

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
    // One refresh of this page, so the row that changed and the counters above
    // it both come from the server. Nothing else is refetched.
    page.reload();
    setMessage("User saved successfully.");
  };

  const removeUser = async (target: PublicUser) => {
    const ok = await runWrite(() => deleteUser(target.id), setMessage);
    if (!ok) return;
    page.reload();
    setMessage(`${target.name} removed.`);
  };

  const toggleStatus = async (target: PublicUser) => {
    const next = !target.status;
    const ok = await runWrite(() => updateUser(target.id, { status: next }), setMessage);
    if (!ok) return;
    page.reload();
    setMessage(`${target.name} marked ${statusLabel(next)}.`);
  };

  // A member manages nobody. The navigation already keeps this view away from
  // them, and this is the second gate, so the table cannot be reached by any
  // other route into it.
  if (!fullAccess) {
    return <section className="content-panel placeholder-panel"><div className="placeholder-icon"><Sparkles size={22} /></div><h2>Users</h2><p>Your account can view its own details from &ldquo;My Details&rdquo;. Managing users is limited to admin, president and manager roles.</p></section>;
  }

  return <div className="workspace-view">
    <section className="view-summary-grid"><SummaryCard label="Total users" value={String(page.counts.total)} icon={<Users size={18} />} /><SummaryCard label="Active users" value={String(page.counts.active)} icon={<Check size={18} />} /><SummaryCard label="Entry fee pending" value={String(page.counts.entryFeePending)} icon={<CircleDollarSign size={18} />} /></section>
    <section className="content-panel directory-panel">
      <div className="filter-bar"><div className="search-box"><Search size={16} /><input value={page.searchText} onChange={(event) => page.setSearchText(event.target.value)} placeholder="Search name, email, mobile or member ID" aria-label="Search users" /></div><select value={page.status} onChange={(event) => page.changeStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select value={page.role} onChange={(event) => page.changeRole(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option><option value="admin">Admin</option><option value="president">President</option><option value="manager">Manager</option><option value="member">Member</option></select><button className="primary-button compact-button" onClick={() => setFormUser("new")}><Users size={15} /> Add user</button></div>
      {message && <p className="success-message" role="status">{message}</p>}
      {page.error && <p className="success-message" role="alert">Not loaded: {page.error}</p>}
      {page.rows.length === 0 ? <EmptyState message={page.loading ? "Loading users…" : "No users match these filters."} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>User</th><th>Member ID</th><th>Mobile</th><th>Room</th><th>Role</th><th>Status</th><th>Joining date</th><th>Entry fee</th><th aria-label="Actions" /></tr></thead><tbody>{page.rows.map((row) => <tr key={row.id}><td><div className="person-cell"><div className="table-avatar">{row.image_url ? <Image src={row.image_url} alt="" width={31} height={31} unoptimized /> : row.name.charAt(0)}</div><div><strong>{row.name}</strong><span>{row.id} · {show(row.email)}</span></div></div></td><td>{show(row.member_id)}</td><td>{show(row.mobile)}</td><td>{show(row.room)}</td><td><span className={roleClass(row.role)}>{roleLabels[row.role]}</span></td><td><span className={`status-badge status-${statusLabel(row.status)}`}>{statusLabel(row.status)}</span></td><td>{show(row.joiningDate)}</td><td>{row.entryFeeStatus ? <span className={`fee-badge fee-${row.entryFeeStatus}`}>{row.entryFeeStatus === "paid" ? "Paid" : "Pending"}</span> : show(null)}</td><td><div className="row-actions"><button className="table-action" onClick={() => setPreviewUser(row)} aria-label={`Preview ${row.name}`}>Preview</button><button className="table-action" onClick={() => setFormUser(row)} aria-label={`Edit ${row.name}`}>Edit</button><button className="table-action" onClick={() => toggleStatus(row)} disabled={!row.status}>Deactivate</button>{row.id !== user.id && <button className="table-action" onClick={() => removeUser(row)} aria-label={`Remove ${row.name}`}>Delete</button>}</div></td></tr>)}</tbody></table></div>}
      <Pagination page={visiblePage} pageSize={page.pageSize} total={page.total} onPageChange={page.setPage} />
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

function MealsView({ user }: { user: AuthenticatedUser }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  // Opening this view is what asks for meals, and for the members a meal can be
  // booked to. Neither is fetched before it is opened.
  const meals = useCollection<Meal[]>("meals");
  const { members } = useMembers(true);
  const today = getTodayDate();
  const records = useMemo(
    () => [...scopedTo(meals.data, user.member_id)].sort((a, b) => b.date.localeCompare(a.date)),
    [meals.data, user.member_id],
  );
  const lunch = records.filter((meal) => meal.date === today && meal.status === "taken" && meal.mealType === "lunch").length;
  const dinner = records.filter((meal) => meal.date === today && meal.status === "taken" && meal.mealType === "dinner").length;
  const canChange = hasFullAccess(user.role);

  return <DataPanel title="Personal meals" caption="Lunch and dinner only" icon={<CookingPot size={19} />} action={canChange ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add meal</button> : undefined}><div className="meal-summary"><span>Lunch today <strong>{lunch}</strong></span><span>Dinner today <strong>{dinner}</strong></span><span>Total today <strong>{lunch + dinner}</strong></span></div>{message && <p className="success-message">{message}</p>}{meals.error && <p className="success-message" role="alert">Not loaded: {meals.error}</p>}{records.length === 0 ? <EmptyState message={isLoading(meals.status) ? "Loading meals…" : "No meals recorded yet."} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Member</th><th>Meal</th><th>Status</th>{canChange && <th />}</tr></thead><tbody>{records.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(members, meal.memberId)}</td><td><span className={`meal-badge ${meal.mealType}`}>{meal.mealType}</span></td><td><span className={`status-badge status-${meal.status === "taken" ? "active" : "inactive"}`}>{meal.status}</span></td>{canChange && <td><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelMeal(meal.id, user.role, user.member_id ?? undefined), setMessage); if (ok) setMessage("Meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div>}<Pagination page={page} pageSize={10} total={records.length} onPageChange={setPage} />{showForm && <FormModal title="Add meal" onClose={() => setShowForm(false)}><MealForm members={members} user={user} onClose={() => setShowForm(false)} onSave={async (value) => { const ok = await runWrite(() => addMeal(value, user.role, user.member_id ?? undefined), setMessage); if (!ok) return; setShowForm(false); setMessage("Meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function GuestMealsView({ user }: { user: AuthenticatedUser }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GuestMeal | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  // Same rule as meals: fetched when the view opens, and only then.
  const guestMeals = useCollection<GuestMeal[]>("guestMeals");
  const { members } = useMembers(true);
  const records = useMemo(() => scopedTo(guestMeals.data, user.member_id), [guestMeals.data, user.member_id]);
  const canChange = hasFullAccess(user.role);

  return <DataPanel title="Guest meals" caption="Separate from personal lunch and dinner" icon={<CalendarDays size={19} />} action={canChange ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add guest meal</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}{guestMeals.error && <p className="success-message" role="alert">Not loaded: {guestMeals.error}</p>}{records.length === 0 ? <EmptyState message={isLoading(guestMeals.status) ? "Loading guest meals…" : "No guest meals recorded yet."} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Added by</th><th>Guest</th><th>Thali</th><th>Price</th><th>Status</th>{canChange && <th />}</tr></thead><tbody>{records.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(members, meal.memberId)}</td><td>{meal.guestName}</td><td className="title-case">{meal.thaliType.replace("-", " ")}</td><td className="amount-cell">{formatCurrency(meal.price)}</td><td><span className={`status-badge status-${meal.status === "confirmed" ? "active" : "inactive"}`}>{meal.status}</span></td>{canChange && <td><button className="table-action" onClick={() => setEditing(meal)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelGuestMeal(meal.id, user.role, user.member_id ?? undefined), setMessage); if (ok) setMessage("Guest meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div>}<Pagination page={page} pageSize={10} total={records.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit guest meal" : "Add guest meal"} onClose={() => { setShowForm(false); setEditing(null); }}><GuestMealForm members={members} user={user} meal={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateGuestMeal(editing.id, value, user.role, user.member_id ?? undefined); else await addGuestMeal(value, user.role, user.member_id ?? undefined); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Guest meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function ExpensesView({ user }: { user: AuthenticatedUser }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  // Expenses are read when this view opens; the dashboard only ever asked for
  // their totals.
  const expenses = useCollection<Expense[]>("expenses");
  const records = expenses.data;
  const total = records.reduce((sum, expense) => sum + expense.amount, 0);
  const fixed = records.filter((expense) => expense.type === "fixed").reduce((sum, expense) => sum + expense.amount, 0);
  const market = records.filter((expense) => expense.type === "market").reduce((sum, expense) => sum + expense.amount, 0);
  const canChange = hasFullAccess(user.role);

  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Monthly expenses" value={currency(total)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Fixed expenses" value={currency(fixed)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Market / bazar" value={currency(market)} icon={<CookingPot size={18} />} /></section><DataPanel title="Expense register" caption="Demo records only · no distribution formula" icon={<CircleDollarSign size={19} />} action={canChange ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add expense</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}{expenses.error && <p className="success-message" role="alert">Not loaded: {expenses.error}</p>}{records.length === 0 ? <EmptyState message={isLoading(expenses.status) ? "Loading expenses…" : "No expenses recorded yet."} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Category</th><th>Type</th><th>Amount</th><th>Description</th>{canChange && <th />}</tr></thead><tbody>{records.slice((page - 1) * 10, page * 10).map((expense) => <tr key={expense.id}><td>{expense.date}</td><td>{expense.category}</td><td><span className={`expense-type expense-${expense.type}`}>{expense.type === "market" ? "Market / Bazar" : "Fixed"}</span></td><td className="amount-cell">{currency(expense.amount)}</td><td>{expense.note}</td>{canChange && <td><button className="table-action" onClick={() => setEditing(expense)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => deleteExpense(expense.id, user.role), setMessage); if (ok) setMessage("Expense deleted."); }}>Delete</button></td>}</tr>)}</tbody></table></div>}<Pagination page={page} pageSize={10} total={records.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit expense" : "Add expense"} onClose={() => { setShowForm(false); setEditing(null); }}><ExpenseForm expense={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateExpense(editing.id, value, user.role); else await addExpense(value, user.role); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Expense saved successfully."); }} /></FormModal>}</DataPanel></div>;
}

// A member's own panel. It reads the signed-in user, so it can only ever show
// that person, and every field is the unified user record, including the ones
// that only exist for some roles.
function MyDetailsView({ user }: { user: AuthenticatedUser }) {
  // The signed-in record itself is the freshest copy the app holds of this
  // person, so no other user is fetched to draw this panel.
  const person = findUserById(user.id) ?? user;
  return <section className="details-grid"><div className="content-panel detail-hero"><div className="large-avatar">{person.name.charAt(0)}</div><h2>{person.name}</h2><p>{person.email}</p><span className={roleClass(person.role)}>{roleLabels[person.role]}</span></div><div className="content-panel detail-list"><Detail label="User ID" value={person.id} /><Detail label="Member ID" value={show(person.member_id)} /><Detail label="Mobile" value={show(person.mobile)} /><Detail label="Address" value={show(person.address)} /><Detail label="Room" value={show(person.room)} /><Detail label="Joining date" value={show(person.joiningDate)} /><Detail label="Status" value={statusLabel(person.status)} /><Detail label="Wallet ID" value={show(person.wallet_id)} /><Detail label="Deposit amount" value={person.deposite_amount === null ? "—" : currency(person.deposite_amount)} /><Detail label="Entry fee" value={person.entryFee === null ? "—" : currency(person.entryFee)} /><Detail label="Entry fee status" value={show(person.entryFeeStatus)} /><Detail label="Entry fee paid date" value={show(person.entryFeePaidDate)} /><Detail label="Last sign-in" value={show(person.login_at)} /><Detail label="Last sign-out" value={show(person.logout_at)} /></div></section>;
}

function ReportsView({ user }: { user: AuthenticatedUser }) {
  // A report is asked for when it is opened, and it needs only the three
  // collections its own figures are joined from. Nothing else is requested.
  const meals = useCollection<Meal[]>("meals");
  const guestMeals = useCollection<GuestMeal[]>("guestMeals");
  const expenses = useCollection<Expense[]>("expenses");
  const { members } = useMembers(true);
  const records = useMemo(() => scopedTo(meals.data, user.member_id), [meals.data, user.member_id]);
  const guestRecords = useMemo(() => scopedTo(guestMeals.data, user.member_id), [guestMeals.data, user.member_id]);
  const today = getTodayDate();
  const [page, setPage] = useState(1);

  // A meal is stored against a member_id, so the count joins on that field.
  const mealByMember = members.map((member) => ({
    member,
    count: records.filter(
      (meal) => member.member_id !== null && meal.memberId === member.member_id && meal.status === "taken",
    ).length,
  }));
  const latestDate = (memberId: string | null) =>
    memberId === null
      ? "-"
      : records
          .filter((meal) => meal.memberId === memberId)
          .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? "-";
  const todayMeals = records.filter((meal) => meal.date === today && meal.status === "taken").length;
  const expenseTotal = expenses.data
    .filter((expense) => expense.type === "fixed" || expense.type === "market")
    .reduce((sum, expense) => sum + expense.amount, 0);

  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Daily meals" value={String(todayMeals)} icon={<CookingPot size={18} />} /><SummaryCard label="Guest report" value={String(guestRecords.length)} icon={<CalendarDays size={18} />} /><SummaryCard label="Expense report" value={currency(expenseTotal)} icon={<CircleDollarSign size={18} />} /></section><DataPanel title="Member meal history" caption="Raw meal records · no settlement formula" icon={<Users size={19} />}><div className="table-scroll"><table className="data-table"><thead><tr><th>Member</th><th>Personal meals</th><th>Latest date</th></tr></thead><tbody>{mealByMember.slice((page - 1) * 10, page * 10).map(({ member, count }) => <tr key={member.id}><td>{member.name}</td><td>{count}</td><td>{latestDate(member.member_id)}</td></tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={mealByMember.length} onPageChange={setPage} /></DataPanel></div>;
}

function SettingsView({ user, mess, settings, fullAccess }: ViewProps & { fullAccess: boolean }) {
  // The document the shell already read, so opening Settings costs no request.
  // The name field shows the stored value until it is edited, which keeps the
  // form in step with a save made from the mess profile editor or a demo reset
  // without copying the document into state.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messName = nameDraft ?? mess.name;
  const save = async () => { const ok = await runWrite(() => updateMess({ name: messName }, user.role), setMessage); if (ok) { setNameDraft(null); setMessage("Mess settings saved to mess.json."); } };
  const reset = async () => { if (window.confirm("Reset BhuriBhoj demo data to the original seed?")) { const ok = await runWrite(() => resetFromServer(), setMessage); if (ok) { setNameDraft(null); setMessage("Demo data restored from the seed files."); } } };
  return <div className="settings-grid"><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Mess profile</span><h3>Current workspace</h3></div><SettingsIcon /></div><label className="form-field">Mess name<input className="form-input" value={messName} onChange={(event) => setNameDraft(event.target.value)} disabled={!fullAccess} /></label><div className="setting-line"><span>Address</span><strong>{mess.address}</strong></div><div className="setting-line"><span>Contact</span><strong>{mess.contactEmail}</strong></div>{fullAccess && <button className="primary-button compact-button" onClick={save}>Save mess settings</button>}</section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Configuration</span><h3>Guest thali prices</h3></div><CircleDollarSign size={19} /></div>{Object.entries(settings.guestThaliPrices).map(([name, price]) => <div className="setting-line" key={name}><span className="title-case">{name.replace("-", " ")}</span><strong>{formatCurrency(price)}</strong></div>)}<p className="settings-note">Prices are centralized prototype settings. Billing rules are not implemented.</p></section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Prototype tools</span><h3>Data reset</h3></div><Sparkles size={19} /></div><p className="settings-note">Restore users, meals, guest meals, expenses, mess, and settings from the original JSON seed.</p><button className="secondary-button" onClick={reset}>Reset demo data</button>{message && <p className="success-message">{message}</p>}</section></div>;
}

function SettingsIcon() { return <span className="placeholder-spark">⚙</span>; }

function DataPanel({ title, caption, icon, action, children }: { title: string; caption: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) { return <section className="content-panel data-panel"><div className="panel-header"><div><span className="panel-eyebrow">{caption}</span><h3>{title}</h3></div><div className="panel-actions">{action}{icon}</div></div>{children}</section>; }
function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <article className="stat-card view-summary-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>; }
function PlaceholderView({ title, fullAccess }: { title: string; fullAccess: boolean }) { return <section className="content-panel placeholder-panel"><div className="placeholder-icon"><Sparkles size={22} /></div><h2>{title} view</h2><p>This workspace area is ready for its next feature milestone. {fullAccess ? "Management access is enabled for your role." : "Your account can view shared information here."}</p></section>; }
