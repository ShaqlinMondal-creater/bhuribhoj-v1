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
import { hasFullAccess, roleLabels } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import type { Member } from "@/types/member";
import type { Meal, GuestMeal } from "@/types/meal";
import type { Expense } from "@/types/expense";
import type { User } from "@/types/user";
import type { Mess } from "@/types/mess";
import type { Settings } from "@/types/settings";
import { addMember, deactivateMember, updateMember } from "@/services/memberService";
import { addMeal, cancelMeal } from "@/services/mealService";
import { addGuestMeal, cancelGuestMeal, updateGuestMeal } from "@/services/guestMealService";
import { addExpense, deleteExpense, updateExpense } from "@/services/expenseService";
import { updateMess } from "@/services/messService";
import { resetFromServer } from "@/data/memoryStore";

import { formatCurrency } from "@/lib/formatters";
import { ExpenseForm, FormModal, GuestMealForm, MealForm, MemberForm } from "@/components/dashboard/PrototypeForms";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

type ViewData = {
  user: AuthenticatedUser;
  members: Member[];
  users: User[];
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
const memberName = (members: Member[], id: string) => members.find((member) => member.id === id)?.name ?? id;
const roleClass = (role: string) => `role-badge role-${role}`;

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
  if (view === "Members") return <MembersView data={data} fullAccess={fullAccess} />;
  if (view === "Meals") return <MealsView data={data} />;
  if (view === "Guest Meals") return <GuestMealsView data={data} />;
  if (view === "Expenses" || view === "Expense Summary") return <ExpensesView data={data} />;
  if (view === "My Details") return <MyDetailsView data={data} />;
  if (view === "Reports") return <ReportsView data={data} />;
  if (view === "Settings") return <SettingsView data={data} fullAccess={fullAccess} />;
  return <PlaceholderView title={view} fullAccess={fullAccess} />;
}

function MembersView({ data, fullAccess }: { data: ViewData; fullAccess: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [formMember, setFormMember] = useState<Member | "new" | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => data.members.filter((member) => {
    const matchesQuery = `${member.name} ${member.id} ${member.email}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || member.status === status) && (role === "all" || member.role === role);
  }), [data.members, query, role, status]);

  return <div className="workspace-view">
    <section className="view-summary-grid"><SummaryCard label="Total members" value={String(data.members.length)} icon={<Users size={18} />} /><SummaryCard label="Active members" value={String(data.members.filter((member) => member.status === "active").length)} icon={<Check size={18} />} /><SummaryCard label="Entry fee pending" value={String(data.members.filter((member) => member.entryFeeStatus === "pending").length)} icon={<CircleDollarSign size={18} />} /></section>
    <section className="content-panel directory-panel">
      <div className="filter-bar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members" aria-label="Search members" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option><option value="member">Member</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="president">President</option></select>{fullAccess && <button className="primary-button compact-button" onClick={() => setFormMember("new")}><Users size={15} /> Add member</button>}</div>
      {message && <p className="success-message" role="status">{message}</p>}
      {filtered.length === 0 ? <EmptyState message="No members match these filters." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Member</th><th>Room</th><th>Role</th><th>Status</th><th>Joining date</th><th>Entry fee</th>{fullAccess && <th aria-label="Actions" />}</tr></thead><tbody>{filtered.slice((page - 1) * 10, page * 10).map((member) => <tr key={member.id}><td><div className="person-cell"><div className="table-avatar">{member.name.charAt(0)}</div><div><strong>{member.name}</strong><span>{member.id} · {member.email}</span></div></div></td><td>{member.room}</td><td><span className={roleClass(member.role)}>{roleLabels[member.role]}</span></td><td><span className={`status-badge status-${member.status}`}>{member.status}</span></td><td>{member.joiningDate}</td><td><span className={`fee-badge fee-${member.entryFeeStatus}`}>{member.entryFeeStatus === "paid" ? "Paid" : "Pending"}</span></td>{fullAccess && <td><div className="row-actions"><button className="table-action" onClick={() => setFormMember(member)} aria-label={`Edit ${member.name}`}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => deactivateMember(member.id, data.user.role), setMessage); if (ok) setMessage(`${member.name} marked inactive.`); }} disabled={member.status === "inactive"}>Deactivate</button></div></td>}</tr>)}</tbody></table></div>}
      <Pagination page={page} pageSize={10} total={filtered.length} onPageChange={setPage} />
      <div className="role-directory"><div><span className="panel-eyebrow">Access directory</span><h3>Every role, one workspace</h3></div><div className="role-list">{data.users.map((account) => <span className={roleClass(account.role)} key={account.id}>{roleLabels[account.role]}</span>)}</div></div>
    </section>
    {formMember && <FormModal title={formMember === "new" ? "Add member" : "Edit member"} onClose={() => setFormMember(null)}><MemberForm member={formMember === "new" ? undefined : formMember} onClose={() => setFormMember(null)} onSave={async (value) => { const ok = await runWrite(async () => { if (formMember === "new") await addMember(value, data.user.role); else await updateMember(formMember.id, value, data.user.role); }, setMessage); if (!ok) return; setFormMember(null); setMessage("Member saved successfully."); }} /></FormModal>}
  </div>;
}

function MealsView({ data }: { data: ViewData }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const records = [...data.meals].sort((a, b) => b.date.localeCompare(a.date));
    return <DataPanel title="Personal meals" caption="Lunch and dinner only" icon={<CookingPot size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add meal</button> : undefined}><div className="meal-summary"><span>Lunch today <strong>{data.todayLunch}</strong></span><span>Dinner today <strong>{data.todayDinner}</strong></span><span>Total today <strong>{data.todayLunch + data.todayDinner}</strong></span></div>{message && <p className="success-message">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Member</th><th>Meal</th><th>Status</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{records.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(data.members, meal.memberId)}</td><td><span className={`meal-badge ${meal.mealType}`}>{meal.mealType}</span></td><td><span className={`status-badge status-${meal.status === "taken" ? "active" : "inactive"}`}>{meal.status}</span></td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelMeal(meal.id, data.user.role, data.user.memberId), setMessage); if (ok) setMessage("Meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={records.length} onPageChange={setPage} />{showForm && <FormModal title="Add meal" onClose={() => setShowForm(false)}><MealForm members={data.members} user={data.user} onClose={() => setShowForm(false)} onSave={async (value) => { const ok = await runWrite(() => addMeal(value, data.user.role, data.user.memberId), setMessage); if (!ok) return; setShowForm(false); setMessage("Meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function GuestMealsView({ data }: { data: ViewData }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GuestMeal | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
    return <DataPanel title="Guest meals" caption="Separate from personal lunch and dinner" icon={<CalendarDays size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add guest meal</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Added by</th><th>Guest</th><th>Thali</th><th>Price</th><th>Status</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{data.guestMeals.slice((page - 1) * 10, page * 10).map((meal) => <tr key={meal.id}><td>{meal.date}</td><td>{memberName(data.members, meal.memberId)}</td><td>{meal.guestName}</td><td className="title-case">{meal.thaliType.replace("-", " ")}</td><td className="amount-cell">{formatCurrency(meal.price)}</td><td><span className={`status-badge status-${meal.status === "confirmed" ? "active" : "inactive"}`}>{meal.status}</span></td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={() => setEditing(meal)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => cancelGuestMeal(meal.id, data.user.role, data.user.memberId), setMessage); if (ok) setMessage("Guest meal cancelled."); }} disabled={meal.status === "cancelled"}>Cancel</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={data.guestMeals.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit guest meal" : "Add guest meal"} onClose={() => { setShowForm(false); setEditing(null); }}><GuestMealForm members={data.members} user={data.user} meal={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateGuestMeal(editing.id, value, data.user.role, data.user.memberId); else await addGuestMeal(value, data.user.role, data.user.memberId); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Guest meal saved successfully."); }} /></FormModal>}</DataPanel>;
}

function ExpensesView({ data }: { data: ViewData }) {
  const total = data.fixedExpenses + data.marketExpenses;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Monthly expenses" value={currency(total)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Fixed expenses" value={currency(data.fixedExpenses)} icon={<CircleDollarSign size={18} />} /><SummaryCard label="Market / bazar" value={currency(data.marketExpenses)} icon={<CookingPot size={18} />} /></section><DataPanel title="Expense register" caption="Demo records only · no distribution formula" icon={<CircleDollarSign size={19} />} action={hasFullAccess(data.user.role) ? <button className="primary-button compact-button" onClick={() => setShowForm(true)}>Add expense</button> : undefined}>{message && <p className="success-message" role="status">{message}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Category</th><th>Type</th><th>Amount</th><th>Description</th>{hasFullAccess(data.user.role) && <th />}</tr></thead><tbody>{data.expenses.slice((page - 1) * 10, page * 10).map((expense) => <tr key={expense.id}><td>{expense.date}</td><td>{expense.category}</td><td><span className={`expense-type expense-${expense.type}`}>{expense.type === "market" ? "Market / Bazar" : "Fixed"}</span></td><td className="amount-cell">{currency(expense.amount)}</td><td>{expense.note}</td>{hasFullAccess(data.user.role) && <td><button className="table-action" onClick={() => setEditing(expense)}>Edit</button><button className="table-action" onClick={async () => { const ok = await runWrite(() => deleteExpense(expense.id, data.user.role), setMessage); if (ok) setMessage("Expense deleted."); }}>Delete</button></td>}</tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={data.expenses.length} onPageChange={setPage} />{(showForm || editing) && <FormModal title={editing ? "Edit expense" : "Add expense"} onClose={() => { setShowForm(false); setEditing(null); }}><ExpenseForm expense={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} onSave={async (value) => { const ok = await runWrite(async () => { if (editing) await updateExpense(editing.id, value, data.user.role); else await addExpense(value, data.user.role); }, setMessage); if (!ok) return; setShowForm(false); setEditing(null); setMessage("Expense saved successfully."); }} /></FormModal>}</DataPanel></div>;
}

function MyDetailsView({ data }: { data: ViewData }) {
  const member = data.members.find((item) => item.id === data.user.memberId);
  if (!member) return <PlaceholderView title="My Details" fullAccess={false} />;
  return <section className="details-grid"><div className="content-panel detail-hero"><div className="large-avatar">{member.name.charAt(0)}</div><h2>{member.name}</h2><p>{member.email}</p><span className={roleClass(member.role)}>{roleLabels[member.role]}</span></div><div className="content-panel detail-list"><Detail label="Member ID" value={member.id} /><Detail label="Room" value={member.room} /><Detail label="Mobile" value={member.mobile} /><Detail label="Joining date" value={member.joiningDate} /><Detail label="Entry fee" value={formatCurrency(member.entryFee)} /><Detail label="Entry fee status" value={member.entryFeeStatus} /></div></section>;
}

function ReportsView({ data }: { data: ViewData }) {
  const mealByMember = data.members.map((member) => ({ member, count: data.meals.filter((meal) => meal.memberId === member.id && meal.status === "taken").length }));
  const [page, setPage] = useState(1);
  return <div className="workspace-view"><section className="view-summary-grid"><SummaryCard label="Daily meals" value={String(data.todayLunch + data.todayDinner)} icon={<CookingPot size={18} />} /><SummaryCard label="Guest report" value={String(data.guestMeals.length)} icon={<CalendarDays size={18} />} /><SummaryCard label="Expense report" value={currency(data.fixedExpenses + data.marketExpenses)} icon={<CircleDollarSign size={18} />} /></section><DataPanel title="Member meal history" caption="Raw meal records · no settlement formula" icon={<Users size={19} />}><div className="table-scroll"><table className="data-table"><thead><tr><th>Member</th><th>Personal meals</th><th>Latest date</th></tr></thead><tbody>{mealByMember.slice((page - 1) * 10, page * 10).map(({ member, count }) => <tr key={member.id}><td>{member.name}</td><td>{count}</td><td>{data.meals.filter((meal) => meal.memberId === member.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? "-"}</td></tr>)}</tbody></table></div><Pagination page={page} pageSize={10} total={mealByMember.length} onPageChange={setPage} /></DataPanel></div>;
}

function SettingsView({ data, fullAccess }: { data: ViewData; fullAccess: boolean }) {
  const [messName, setMessName] = useState(data.mess.name);
  const [message, setMessage] = useState("");
  const save = async () => { const ok = await runWrite(() => updateMess({ name: messName }, data.user.role), setMessage); if (ok) setMessage("Mess settings saved to mess.json."); };
  const reset = async () => { if (window.confirm("Reset BhuriBhoj demo data to the original seed?")) { const ok = await runWrite(() => resetFromServer(), setMessage); if (ok) setMessage("Demo data restored from the seed files."); } };
  return <div className="settings-grid"><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Mess profile</span><h3>Current workspace</h3></div><SettingsIcon /></div><label className="form-field">Mess name<input className="form-input" value={messName} onChange={(event) => setMessName(event.target.value)} disabled={!fullAccess} /></label><div className="setting-line"><span>Address</span><strong>{data.mess.address}</strong></div><div className="setting-line"><span>Contact</span><strong>{data.mess.contactEmail}</strong></div>{fullAccess && <button className="primary-button compact-button" onClick={save}>Save mess settings</button>}</section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Configuration</span><h3>Guest thali prices</h3></div><CircleDollarSign size={19} /></div>{Object.entries(data.settings.guestThaliPrices).map(([name, price]) => <div className="setting-line" key={name}><span className="title-case">{name.replace("-", " ")}</span><strong>{formatCurrency(price)}</strong></div>)}<p className="settings-note">Prices are centralized prototype settings. Billing rules are not implemented.</p></section><section className="content-panel settings-card"><div className="panel-header"><div><span className="panel-eyebrow">Prototype tools</span><h3>Data reset</h3></div><Sparkles size={19} /></div><p className="settings-note">Restore members, meals, guest meals, expenses, mess, and settings from the original JSON seed.</p><button className="secondary-button" onClick={reset}>Reset demo data</button>{message && <p className="success-message">{message}</p>}</section></div>;
}

function SettingsIcon() { return <span className="placeholder-spark">⚙</span>; }

function DataPanel({ title, caption, icon, action, children }: { title: string; caption: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) { return <section className="content-panel data-panel"><div className="panel-header"><div><span className="panel-eyebrow">{caption}</span><h3>{title}</h3></div><div className="panel-actions">{action}{icon}</div></div>{children}</section>; }
function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <article className="stat-card view-summary-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>; }
function PlaceholderView({ title, fullAccess }: { title: string; fullAccess: boolean }) { return <section className="content-panel placeholder-panel"><div className="placeholder-icon"><Sparkles size={22} /></div><h2>{title} view</h2><p>This workspace area is ready for its next feature milestone. {fullAccess ? "Management access is enabled for your role." : "Your account can view shared information here."}</p></section>; }