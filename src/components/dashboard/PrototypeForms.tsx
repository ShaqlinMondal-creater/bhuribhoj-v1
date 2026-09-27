"use client";

import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Member } from "@/types/member";
import type { Meal, GuestMeal } from "@/types/meal";
import type { Expense, ExpenseCategory } from "@/types/expense";
import type { Role } from "@/types/user";

const memberSchema = z.object({ name: z.string().min(2), email: z.string().email(), mobile: z.string().min(7), room: z.string().min(1), joiningDate: z.string().min(1), role: z.enum(["admin", "manager", "president", "member"]), entryFee: z.coerce.number().min(0), entryFeeStatus: z.enum(["paid", "pending"]), entryFeePaidDate: z.string() });
const mealSchema = z.object({ memberId: z.string().min(1), date: z.string().min(1), mealType: z.enum(["lunch", "dinner"]), status: z.enum(["taken", "cancelled"]) });
const guestSchema = z.object({ memberId: z.string().min(1), guestName: z.string().min(2), date: z.string().min(1), thaliType: z.enum(["fish-thali", "chicken-thali", "veg-thali", "egg-thali"]), status: z.enum(["confirmed", "cancelled"]) });
const expenseSchema = z.object({ date: z.string().min(1), category: z.string().min(1), amount: z.coerce.number().positive(), type: z.enum(["fixed", "market"]), note: z.string().min(2) });

type ModalProps = { title: string; onClose: () => void; children: React.ReactNode };
export function FormModal({ title, onClose, children }: ModalProps) { return <div className="modal-backdrop" role="presentation"><section className="form-modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><div><span className="panel-eyebrow">Prototype editor</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>{children}</section></div>; }

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => <label className="form-field"><span>{label}</span>{children}{error && <small className="form-error">{error}</small>}</label>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input className="form-input" {...props} />;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="form-input" {...props} />;
const Actions = ({ onCancel }: { onCancel: () => void }) => <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button">Save changes</button></div>;

export function MemberForm({ member, onSave, onClose }: { member?: Member; onSave: (value: Omit<Member, "id">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { name: member?.name ?? "", email: member?.email ?? "", mobile: member?.mobile ?? "", room: member?.room ?? "", joiningDate: member?.joiningDate ?? "2026-09-27", role: member?.role ?? "member", entryFee: member?.entryFee ?? 1500, entryFeeStatus: member?.entryFeeStatus ?? "pending", entryFeePaidDate: member?.entryFeePaidDate ?? "" } });
  return <form onSubmit={handleSubmit((value) => { const parsed = memberSchema.safeParse(value); if (parsed.success) onSave({ ...parsed.data, status: member?.status ?? "active", entryFeePaidDate: parsed.data.entryFeePaidDate || null }); })}><div className="form-grid"><Field label="Name" error={errors.name?.message}><Input {...register("name")} /></Field><Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field><Field label="Mobile" error={errors.mobile?.message}><Input {...register("mobile")} /></Field><Field label="Room" error={errors.room?.message}><Input {...register("room")} /></Field><Field label="Joining date"><Input type="date" {...register("joiningDate")} /></Field><Field label="Role"><Select {...register("role")}><option value="member">Member</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="president">President</option></Select></Field><Field label="Entry fee"><Input type="number" {...register("entryFee")} /></Field><Field label="Entry fee status"><Select {...register("entryFeeStatus")}><option value="pending">Pending</option><option value="paid">Paid</option></Select></Field><Field label="Paid date"><Input type="date" {...register("entryFeePaidDate")} /></Field></div><Actions onCancel={onClose} /></form>;
}

export function MealForm({ members, user, onSave, onClose }: { members: Member[]; user: { role: Role; memberId?: string }; onSave: (value: Omit<Meal, "id" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { memberId: user.memberId ?? members[0]?.id ?? "", date: "2026-09-27", mealType: "lunch", status: "taken" } });
  return <form onSubmit={handleSubmit((value) => { const parsed = mealSchema.safeParse(value); if (parsed.success) onSave(parsed.data); })}><div className="form-grid"><Field label="Member" error={errors.memberId?.message}><Select {...register("memberId")} disabled={Boolean(user.memberId)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field><Field label="Date"><Input type="date" {...register("date")} /></Field><Field label="Meal type"><Select {...register("mealType")}><option value="lunch">Lunch</option><option value="dinner">Dinner</option></Select></Field></div><Actions onCancel={onClose} /></form>;
}

export function GuestMealForm({ members, user, onSave, onClose }: { members: Member[]; user: { role: Role; memberId?: string }; onSave: (value: Omit<GuestMeal, "id" | "price" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { memberId: user.memberId ?? members[0]?.id ?? "", guestName: "", date: "2026-09-27", thaliType: "fish-thali", status: "confirmed" } });
  return <form onSubmit={handleSubmit((value) => { const parsed = guestSchema.safeParse(value); if (parsed.success) onSave(parsed.data); })}><div className="form-grid"><Field label="Member"><Select {...register("memberId")} disabled={Boolean(user.memberId)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field><Field label="Guest name" error={errors.guestName?.message}><Input {...register("guestName")} /></Field><Field label="Date"><Input type="date" {...register("date")} /></Field><Field label="Thali"><Select {...register("thaliType")}><option value="fish-thali">Fish-Thali · ₹70</option><option value="chicken-thali">Chicken-Thali · ₹90</option><option value="veg-thali">Veg-Thali · ₹45</option><option value="egg-thali">Egg-Thali · ₹55</option></Select></Field></div><Actions onCancel={onClose} /></form>;
}

const categories: ExpenseCategory[] = ["Cook Salary", "Gas", "Electricity", "Cleaning", "Internet", "Other Fixed Charges", "Rice", "Vegetables", "Fish", "Chicken", "Egg", "Oil", "Spices", "Grocery", "Other Market Expense"];
export function ExpenseForm({ onSave, onClose }: { onSave: (value: Omit<Expense, "id" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { date: "2026-09-27", category: "Rice", amount: 0, type: "market", note: "" } });
  return <form onSubmit={handleSubmit((value) => { const parsed = expenseSchema.safeParse(value); if (parsed.success) onSave({ ...parsed.data, category: parsed.data.category as ExpenseCategory, description: parsed.data.note }); })}><div className="form-grid"><Field label="Date"><Input type="date" {...register("date")} /></Field><Field label="Category"><Select {...register("category")}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field><Field label="Type"><Select {...register("type")}><option value="fixed">Fixed</option><option value="market">Market / Bazar</option></Select></Field><Field label="Amount" error={errors.amount?.message}><Input type="number" min="1" {...register("amount")} /></Field><Field label="Description" error={errors.note?.message}><Input {...register("note")} /></Field></div><Actions onCancel={onClose} /></form>;
}