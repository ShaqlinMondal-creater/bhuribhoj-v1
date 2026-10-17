"use client";

import { useState } from "react";

type Fields = {
  name: string;
  mess: string;
  members: string;
  phone: string;
  email: string;
  message: string;
};

type Errors = Partial<Record<keyof Fields | "contact", string>>;

const empty: Fields = { name: "", mess: "", members: "", phone: "", email: "", message: "" };

const fieldClass =
  "mt-2 w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";

export function ContactForm() {
  const [values, setValues] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function update(key: keyof Fields, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate(next: Fields): Errors {
    const found: Errors = {};
    if (next.name.trim().length < 2) found.name = "Enter your name.";
    if (next.mess.trim().length < 2) found.mess = "Enter the mess name.";
    const count = Number(next.members);
    if (!Number.isInteger(count) || count < 1) found.members = "Enter how many members eat here.";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim());
    const phoneOk = /^[0-9+\-\s]{8,}$/.test(next.phone.trim());
    if (next.email.trim() && !emailOk) found.email = "Enter a valid email.";
    if (next.phone.trim() && !phoneOk) found.phone = "Enter a valid phone number.";
    if (!emailOk && !phoneOk) found.contact = "Enter a valid email or phone number.";
    if (next.message.trim().length < 10) found.message = "Write at least a sentence about the house.";
    return found;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-5 text-sm leading-7" role="status">
        Received. This note stays on the page for now. A live inbox connects here next.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field label="Name" error={errors.name}>
        <input name="name" value={values.name} onChange={(event) => update("name", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.name)} required />
      </Field>
      <Field label="Mess name" error={errors.mess}>
        <input name="mess" value={values.mess} onChange={(event) => update("mess", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.mess)} required />
      </Field>
      <Field label="Number of members" error={errors.members}>
        <input name="members" inputMode="numeric" value={values.members} onChange={(event) => update("members", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.members)} required />
      </Field>
      <Field label="Phone" error={errors.phone}>
        <input name="phone" type="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.phone)} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input name="email" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.email)} />
      </Field>
      {errors.contact ? <p className="text-sm text-[#ffb4b4]">{errors.contact}</p> : null}
      <Field label="Message" error={errors.message}>
        <textarea name="message" rows={4} value={values.message} onChange={(event) => update("message", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.message)} required />
      </Field>
      <button type="submit" className="m-btn m-btn-primary">
        Send
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
      {label}
      {children}
      {error ? <span className="mt-2 block text-xs font-medium normal-case tracking-normal text-[#ffb4b4]">{error}</span> : null}
    </label>
  );
}
