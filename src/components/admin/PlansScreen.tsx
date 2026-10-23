"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { planService } from "@/services/planService";
import type { Plan } from "@/types/auth";

const fieldClass =
  "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700";

export function PlansScreen() {
  const plans = useApi(planService.fetch);
  const rows = plans.data?.data ?? [];
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Platform" title="Plans" description="The prices a president can buy. Only an admin can see or change them." />
      {plans.error || error ? <Notice>{error || plans.error}</Notice> : null}
      {done ? <p className="text-sm text-emerald-800">{done}</p> : null}
      {plans.loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!plans.loading && !plans.error && rows.length === 0 ? (
        <EmptyState icon="plans" title="No plans yet" description="Add the first price. The public site stays empty until a plan exists." />
      ) : null}
      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((plan) => (
            <PlanRow
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
      ) : null}
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
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-900">Add a plan</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Name
          <input name="name" required className={fieldClass} placeholder="1 Month" />
        </label>
        <label className="block text-sm text-stone-600">
          Months
          <input name="duration_months" type="number" min="1" max="60" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Price (₹)
          <input name="price_inr" type="number" min="1" step="1" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Status
          <select name="is_active" defaultValue="1" className={fieldClass}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Add plan"}
      </button>
    </form>
  );
}

function PlanRow({
  plan,
  onChanged,
  onFailed,
}: {
  plan: Plan;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

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
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-stone-900">{inr(plan.price_inr)}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.is_active === false ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-800"}`}>
          {plan.is_active === false ? "Inactive" : "Active"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Name
          <input name="name" required defaultValue={plan.name} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Months
          <input name="duration_months" type="number" min="1" max="60" required defaultValue={plan.duration_months} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Price (₹)
          <input name="price_inr" type="number" min="1" step="1" required defaultValue={plan.price_inr} className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Status
          <select name="is_active" defaultValue={plan.is_active === false ? "0" : "1"} className={fieldClass}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" disabled={pending} onClick={onDelete} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60">
          Delete
        </button>
      </div>
    </form>
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
