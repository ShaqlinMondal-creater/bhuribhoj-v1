"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PublicUser, Role } from "@/types/user";
import type { Meal, GuestMeal } from "@/types/meal";
import type { Expense, ExpenseCategory } from "@/types/expense";
import { getTodayDate } from "@/lib/dates";

// The user form covers every role. A password is asked for only when the user is
// new: an existing account keeps the hash already on the server, and the update
// patch has no password field, so editing a person can never rewrite it.
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  // An existing user has no password field at all, so the form's value for it is
  // the empty string. That has to validate, otherwise the whole edit form fails
  // with an error on a field nobody can see. An empty value is dropped from the
  // payload on submit; a typed one still has to be a real password.
  password: z.string().min(6).or(z.literal("")).optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  room: z.string().optional(),
  joiningDate: z.string().optional(),
  role: z.enum(["admin", "manager", "president", "member"]),
  member_id: z.string().optional(),
  wallet_id: z.coerce.number().min(1).optional().or(z.literal("").transform(() => undefined)),
  deposite_amount: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  entryFee: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  entryFeeStatus: z.enum(["paid", "pending"]).optional(),
  entryFeePaidDate: z.string().optional(),
  image_url: z.string().optional(),
});
const mealSchema = z.object({ memberId: z.string().min(1), date: z.string().min(1), mealType: z.enum(["lunch", "dinner"]), status: z.enum(["taken", "cancelled"]) });
const guestSchema = z.object({ memberId: z.string().min(1), guestName: z.string().min(2), date: z.string().min(1), thaliType: z.enum(["fish-thali", "chicken-thali", "veg-thali", "egg-thali"]), status: z.enum(["confirmed", "cancelled"]) });
const expenseSchema = z.object({ date: z.string().min(1), category: z.string().min(1), amount: z.coerce.number().positive(), type: z.enum(["fixed", "market"]), note: z.string().min(2) });

/** An empty string in a form field means "not set", which the record stores as null. */
const orNull = (value?: string) => (value?.trim() ? value.trim() : null);
const orNumber = (value?: number) => (typeof value === "number" && !Number.isNaN(value) ? value : null);

export type UserFormValue = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  status: boolean;
  member_id: string | null;
  mobile: string | null;
  address: string | null;
  room: string | null;
  joiningDate: string | null;
  wallet_id: number | null;
  deposite_amount: number | null;
  entryFee: number | null;
  entryFeeStatus: "paid" | "pending" | null;
  entryFeePaidDate: string | null;
  image_url: string | null;
};

type ModalProps = { title: string; onClose: () => void; children: React.ReactNode; eyebrow?: string };
export function FormModal({ title, onClose, children, eyebrow = "Prototype editor" }: ModalProps) { return <div className="modal-backdrop" role="presentation"><motion.section className="form-modal" role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, scale: .97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .18 }}><div className="modal-header"><div><span className="panel-eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>{children}</motion.section></div>; }

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => <label className="form-field"><span>{label}</span>{children}{error && <small className="form-error">{error}</small>}</label>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input className="form-input" {...props} />;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="form-input" {...props} />;
const Actions = ({ onCancel }: { onCancel: () => void }) => <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button">Save changes</button></div>;

export function UserForm({ user, onSave, onClose }: { user?: PublicUser; onSave: (value: UserFormValue) => void; onClose: () => void }) {
  const isNew = !user;
  const { register, handleSubmit, control, formState: { errors } } = useForm<z.input<typeof userSchema>, unknown, z.output<typeof userSchema>>({ resolver: zodResolver(userSchema), defaultValues: { name: user?.name ?? "", email: user?.email ?? "", password: "", mobile: user?.mobile ?? "", address: user?.address ?? "", room: user?.room ?? "", joiningDate: user?.joiningDate ?? getTodayDate(), role: user?.role ?? "member", member_id: user?.member_id ?? "", wallet_id: user?.wallet_id ?? undefined, deposite_amount: user?.deposite_amount ?? undefined, entryFee: user?.entryFee ?? 1500, entryFeeStatus: user?.entryFeeStatus ?? "pending", entryFeePaidDate: user?.entryFeePaidDate ?? "", image_url: user?.image_url ?? "" } });
  // The member-only fields are only meaningful for a member, so they are disabled
  // for the other roles rather than showing an editable value that is ignored.
  const isMember = useWatch({ control, name: "role" }) === "member";
  return <form onSubmit={handleSubmit((value) => onSave({
    name: value.name,
    email: value.email,
    // Only a new user gets a password, and it is hashed by the server on the way in.
    ...(value.password ? { password: value.password } : {}),
    role: value.role,
    status: user?.status ?? true,
    // A member_id only belongs to a member, so any other role stores null.
    member_id: value.role === "member" ? orNull(value.member_id) : null,
    mobile: orNull(value.mobile),
    address: orNull(value.address),
    room: orNull(value.room),
    joiningDate: orNull(value.joiningDate),
    wallet_id: orNumber(value.wallet_id),
    deposite_amount: orNumber(value.deposite_amount),
    entryFee: orNumber(value.entryFee),
    entryFeeStatus: value.role === "member" ? (value.entryFeeStatus ?? null) : null,
    entryFeePaidDate: value.role === "member" ? orNull(value.entryFeePaidDate) : null,
    image_url: orNull(value.image_url),
  }))}><div className="form-grid"><Field label="Name" error={errors.name?.message}><Input {...register("name")} /></Field><Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>{isNew && <Field label="Temporary password" error={errors.password?.message}><Input type="password" {...register("password")} /></Field>}<Field label="Mobile" error={errors.mobile?.message}><Input {...register("mobile")} /></Field><Field label="Address" error={errors.address?.message}><Input {...register("address")} /></Field><Field label="Room" error={errors.room?.message}><Input {...register("room")} /></Field><Field label="Joining date" error={errors.joiningDate?.message}><Input type="date" {...register("joiningDate")} /></Field><Field label="Role" error={errors.role?.message}><Select {...register("role")}><option value="member">Member</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="president">President</option></Select></Field><Field label="Member ID" error={errors.member_id?.message}><Input {...register("member_id")} disabled={!isMember} /></Field><Field label="Wallet ID" error={errors.wallet_id?.message}><Input type="number" {...register("wallet_id")} /></Field><Field label="Deposit amount" error={errors.deposite_amount?.message}><Input type="number" {...register("deposite_amount")} /></Field><Field label="Entry fee" error={errors.entryFee?.message}><Input type="number" {...register("entryFee")} /></Field><Field label="Entry fee status" error={errors.entryFeeStatus?.message}><Select {...register("entryFeeStatus")} disabled={!isMember}><option value="pending">Pending</option><option value="paid">Paid</option></Select></Field><Field label="Paid date" error={errors.entryFeePaidDate?.message}><Input type="date" {...register("entryFeePaidDate")} disabled={!isMember} /></Field><Field label="Image URL" error={errors.image_url?.message}><Input {...register("image_url")} placeholder="https://" /></Field></div><Actions onCancel={onClose} /></form>;
}

// A meal is booked against a member_id, so the options are the users who carry
// one and the value stored is that member_id, which is what the existing meal
// records already hold.
export function MealForm({ members, user, onSave, onClose }: { members: PublicUser[]; user: { role: Role; member_id?: string | null }; onSave: (value: Omit<Meal, "id" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof mealSchema>, unknown, z.output<typeof mealSchema>>({ resolver: zodResolver(mealSchema), defaultValues: { memberId: user.member_id ?? members[0]?.member_id ?? "", date: getTodayDate(), mealType: "lunch", status: "taken" } });
  return <form onSubmit={handleSubmit((value) => onSave(value))}><div className="form-grid"><Field label="Member" error={errors.memberId?.message}><Select {...register("memberId")} disabled={Boolean(user.member_id)}>{members.map((member) => <option key={member.id} value={member.member_id ?? ""}>{member.name}</option>)}</Select></Field><Field label="Date" error={errors.date?.message}><Input type="date" {...register("date")} /></Field><Field label="Meal type" error={errors.mealType?.message}><Select {...register("mealType")}><option value="lunch">Lunch</option><option value="dinner">Dinner</option></Select></Field></div><Actions onCancel={onClose} /></form>;
}

export function GuestMealForm({ members, user, meal, onSave, onClose }: { members: PublicUser[]; user: { role: Role; member_id?: string | null }; meal?: GuestMeal; onSave: (value: Omit<GuestMeal, "id" | "price" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof guestSchema>, unknown, z.output<typeof guestSchema>>({ resolver: zodResolver(guestSchema), defaultValues: { memberId: meal?.memberId ?? user.member_id ?? members[0]?.member_id ?? "", guestName: meal?.guestName ?? "", date: meal?.date ?? getTodayDate(), thaliType: meal?.thaliType ?? "fish-thali", status: meal?.status ?? "confirmed" } });
  return <form onSubmit={handleSubmit((value) => onSave(value))}><div className="form-grid"><Field label="Member" error={errors.memberId?.message}><Select {...register("memberId")} disabled={Boolean(user.member_id)}>{members.map((member) => <option key={member.id} value={member.member_id ?? ""}>{member.name}</option>)}</Select></Field><Field label="Guest name" error={errors.guestName?.message}><Input {...register("guestName")} /></Field><Field label="Date" error={errors.date?.message}><Input type="date" {...register("date")} /></Field><Field label="Thali" error={errors.thaliType?.message}><Select {...register("thaliType")}><option value="fish-thali">Fish-Thali · ₹70</option><option value="chicken-thali">Chicken-Thali · ₹90</option><option value="veg-thali">Veg-Thali · ₹45</option><option value="egg-thali">Egg-Thali · ₹55</option></Select></Field></div><Actions onCancel={onClose} /></form>;
}

const categories: ExpenseCategory[] = ["Cook Salary", "Gas", "Electricity", "Cleaning", "Internet", "Other Fixed Charges", "Rice", "Vegetables", "Fish", "Chicken", "Egg", "Oil", "Spices", "Grocery", "Other Market Expense"];
export function ExpenseForm({ expense, onSave, onClose }: { expense?: Expense; onSave: (value: Omit<Expense, "id" | "createdAt" | "updatedAt">) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof expenseSchema>, unknown, z.output<typeof expenseSchema>>({ resolver: zodResolver(expenseSchema), defaultValues: { date: expense?.date ?? getTodayDate(), category: expense?.category ?? "Rice", amount: expense?.amount ?? 0, type: expense?.type ?? "market", note: expense?.note ?? expense?.description ?? "" } });
  return <form onSubmit={handleSubmit((value) => onSave({ ...value, category: value.category as ExpenseCategory, description: value.note }))}><div className="form-grid"><Field label="Date" error={errors.date?.message}><Input type="date" {...register("date")} /></Field><Field label="Category" error={errors.category?.message}><Select {...register("category")}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field><Field label="Type" error={errors.type?.message}><Select {...register("type")}><option value="fixed">Fixed</option><option value="market">Market / Bazar</option></Select></Field><Field label="Amount" error={errors.amount?.message}><Input type="number" min="1" {...register("amount")} /></Field><Field label="Description" error={errors.note?.message}><Input {...register("note")} /></Field></div><Actions onCancel={onClose} /></form>;
}