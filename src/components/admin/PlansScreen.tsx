"use client";

import { useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { planService } from "@/services/planService";
import type { Plan } from "@/types/auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-[var(--panel-ink)] outline-none focus:border-[var(--accent)]";

export function PlansScreen() {
  const plans = useApi(planService.fetch);
  const rows = plans.data?.data ?? [];
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Plans"
        description="The prices a president can buy. Only an admin can see or change them."
      />
      {plans.error || error ? <Notice>{error || plans.error}</Notice> : null}
      {done ? <p className="text-sm text-[var(--brand)]">{done}</p> : null}
      {plans.loading ? <div className="h-64 animate-pulse rounded-2xl bg-[var(--panel)]" /> : null}
      <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!plans.loading ? (
          <CreatePlan
            onCreated={(message) => {
              setError(null);
              setDone(message);
              plans.reload();
            }}
            onFailed={(message) => {
              setDone(null);
              setError(message);
            }}
          />
        ) : null}
        {rows.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onChanged={(message) => {
              setError(null);
              setDone(message);
              plans.reload();
            }}
            onFailed={(message) => {
              setDone(null);
              setError(message);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function CreatePlan({ onCreated, onFailed }: { onCreated: (message: string) => void; onFailed: (message: string) => void }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const result = await planService.create(readPlan(data));
      form.reset();
      onCreated(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not create the plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--panel)] p-3.5 text-[var(--panel-ink)]">
      <h2 className="text-sm font-semibold">Add a plan</h2>
      <p className="mt-3 text-2xl font-semibold text-[var(--accent)]">New price</p>
      <p className="mt-1 text-xs text-[var(--panel-muted)]">Name, months, and the amount.</p>
      <div className="mt-3 flex-1 space-y-2">
        <Field label="Name">
          <input name="name" required className={fieldClass} placeholder="1 Month" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Months">
            <input name="duration_months" type="number" min="1" max="60" required className={fieldClass} />
          </Field>
          <Field label="Price (₹)">
            <input name="price_inr" type="number" min="1" step="1" required className={fieldClass} />
          </Field>
        </div>
        <Field label="Status">
          <select name="is_active" defaultValue="1" className={fieldClass}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </Field>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-ink)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add plan"}
      </button>
    </form>
  );
}

function PlanCard({
  plan,
  onChanged,
  onFailed,
}: {
  plan: Plan;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const active = plan.is_active !== false;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await planService.update({ id: plan.id, ...readPlan(data) });
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not update the plan.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    setPending(true);
    try {
      const result = await planService.remove(plan.id);
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col rounded-xl border p-3.5 text-[var(--panel-ink)] ${
        active ? "border-[var(--accent)] bg-[var(--panel)]" : "border-white/10 bg-[var(--panel)] opacity-80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">{plan.name}</h2>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-white/10 text-[var(--panel-muted)]"}`}>
          {active ? "Active" : "Inactive"}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--accent)]">{inr(plan.price_inr)}</p>
      <p className="mt-1 text-xs text-[var(--panel-muted)]">
        {plan.duration_months} month{plan.duration_months > 1 ? "s" : ""} · one mess
      </p>
      <div className="mt-3 flex-1 space-y-2 border-t border-white/10 pt-3">
        <Field label="Name">
          <input name="name" required defaultValue={plan.name} className={fieldClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Months">
            <input name="duration_months" type="number" min="1" max="60" required defaultValue={plan.duration_months} className={fieldClass} />
          </Field>
          <Field label="Price (₹)">
            <input name="price_inr" type="number" min="1" step="1" required defaultValue={plan.price_inr} className={fieldClass} />
          </Field>
        </div>
        <Field label="Status">
          <select name="is_active" defaultValue={active ? "1" : "0"} className={fieldClass}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-ink)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-[var(--panel-ink)] disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--panel-muted)]">
      {label}
      {children}
    </label>
  );
}

function readPlan(data: FormData) {
  return {
    name: String(data.get("name") ?? "").trim(),
    duration_months: Number(data.get("duration_months")),
    price_inr: Number(data.get("price_inr")),
    is_active: String(data.get("is_active") ?? "1") === "1",
  };
}
