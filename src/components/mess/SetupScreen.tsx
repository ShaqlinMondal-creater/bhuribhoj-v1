"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetMessSeat } from "@/components/auth/MessSession";
import { fieldClass } from "@/components/ui/classes";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import type { FundType } from "@/lib/api/mess";
import { messService } from "@/services/messService";

export function SetupScreen() {
  const router = useRouter();
  const setSeat = useSetMessSeat();
  const [fundType, setFundType] = useState<FundType>("manager_only");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const fund = form.get("fund_type") === "mess_and_manager" ? "mess_and_manager" : "manager_only";
    const deposit = optionalNumber(form.get("s_deposite_amount"));

    try {
      const result = await messService.open({
        name: String(form.get("name") ?? ""),
        address: String(form.get("address") ?? ""),
        district: String(form.get("district") ?? ""),
        pincode: String(form.get("pincode") ?? ""),
        contact_no: String(form.get("contact_no") ?? ""),
        email: optionalText(form.get("email")),
        fund_type: fund,
        monthly_due_amount: 0,
        monthly_due_days: null,
        late_fee_amount: 0,
        s_deposite_amount: fund === "mess_and_manager" ? (deposit ?? null) : null,
      });
      setSeat(result.seat);
      router.push("/mess");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the mess.");
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Mess" title="Mess details" description="Payment is done. Save the house, then the dashboard opens." />
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Name
          <input name="name" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Address
          <input name="address" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          District
          <input name="district" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Pincode
          <input name="pincode" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Contact
          <input name="contact_no" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Email
          <input name="email" type="email" className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Fund
          <select
            name="fund_type"
            className={fieldClass}
            value={fundType}
            onChange={(event) => setFundType(event.target.value === "mess_and_manager" ? "mess_and_manager" : "manager_only")}
          >
            <option value="manager_only">Manager fund only</option>
            <option value="mess_and_manager">Mess fund and manager fund</option>
          </select>
        </label>
        {fundType === "mess_and_manager" ? (
          <label className="block text-sm text-stone-600 sm:col-span-2">
            Starting deposit
            <input name="s_deposite_amount" type="number" min="0" step="0.01" className={fieldClass} />
          </label>
        ) : null}
        {error ? (
          <div className="sm:col-span-2">
            <Notice>{error}</Notice>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Saving…" : "Save mess"}
          </button>
        </div>
      </form>
    </section>
  );
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}
