"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetMessSeat } from "@/components/auth/MessSession";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { messService } from "@/services/messService";

const fieldClass =
  "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700";

export function SetupScreen() {
  const router = useRouter();
  const setSeat = useSetMessSeat();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const fund = String(form.get("fund_mode") ?? "manager_only");

    try {
      const result = await messService.open({
        name: String(form.get("name") ?? ""),
        address: String(form.get("address") ?? ""),
        district: String(form.get("district") ?? ""),
        pincode: String(form.get("pincode") ?? ""),
        contact_no: String(form.get("contact_no") ?? ""),
        email: String(form.get("email") ?? ""),
        fund_mode: fund === "mess_and_manager" ? "mess_and_manager" : "manager_only",
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
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600 sm:col-span-2">
          Fund
          <select name="fund_mode" className={fieldClass} defaultValue="manager_only">
            <option value="manager_only">Manager fund only</option>
            <option value="mess_and_manager">Mess fund and manager fund</option>
          </select>
        </label>
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
