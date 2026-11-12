"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessSeat, useMessUser, useSetMessSeat } from "@/components/auth/MessSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { inr } from "@/lib/format";
import { isPresident } from "@/lib/auth/roles";
import { planFeatures, planLabel } from "@/components/marketing/PlanCards";
import { planService } from "@/services/planService";
import type { Plan } from "@/types/auth";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export function PlansScreen() {
  const router = useRouter();
  const user = useMessUser();
  const seat = useMessSeat();
  const setSeat = useSetMessSeat();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isPresident(user?.role)) return;
    planService
      .fetch()
      .then((result) => setPlans(result.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load plans."));
  }, [user?.role]);

  async function buy(plan: Plan) {
    setError(null);
    setNotice(null);
    setPendingId(plan.id);
    try {
      const order = await planService.order(plan.id, couponCode);
      if (order.free) {
        setPendingId(null);
        if (order.seat) setSeat(order.seat);
        setNotice(order.message ?? "Coupon applied. Subscription is active.");
        if (order.seat && !order.seat.mess) router.push("/mess/setup");
        return;
      }

      if (!order.key || !order.order_id || !order.currency) {
        throw new Error("Payment could not start.");
      }

      const payable = Math.round(order.amount / 100);
      const Razorpay = await loadRazorpay();
      const checkout = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "BhuriBhoj",
        description:
          order.discount_inr && order.discount_inr > 0
            ? `${planLabel(plan)} · ${inr(payable)} after coupon`
            : `${planLabel(plan)} · ${inr(plan.price_inr)}`,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile ?? undefined,
        },
        readonly: { email: true },
        theme: { color: "#065f46" },
        handler: (response) => {
          void confirmPayment(response);
        },
        modal: { ondismiss: () => setPendingId(null) },
        "payment.failed": (failed) => {
          const reason = failed.error?.description || "Payment was not completed.";
          const metadata = failed.error?.metadata;
          const paymentId = typeof metadata === "object" && metadata ? metadata.payment_id : undefined;
          void planService
            .fail({
              razorpay_order_id: order.order_id!,
              razorpay_payment_id: paymentId,
              failure_reason: reason,
            })
            .catch(() => undefined);
          setError(reason);
          setPendingId(null);
        },
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment.");
      setPendingId(null);
    }
  }

  async function confirmPayment(response: RazorpaySuccess) {
    try {
      const result = await planService.verify(response);
      setPendingId(null);
      setSeat(result.seat);
      setNotice(result.message);
      if (!result.seat.mess) router.push("/mess/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be confirmed.");
      setPendingId(null);
    }
  }

  if (!user) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
  }

  if (!isPresident(user.role)) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Subscription" title="Plans" description="Only the president can buy or change the mess plan." />
        <EmptyState icon="plans" title="President only" description="Ask the president if the mess needs a new plan." />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Choose a plan"
        description={seat?.subscription ? "The plan you already paid for is marked. A different length is an upgrade." : "The mess stays closed until this payment succeeds."}
      />
      {error ? <Notice>{error}</Notice> : null}
      {notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
        <label className="block text-sm font-medium text-stone-700" htmlFor="coupon-code">
          Coupon code
        </label>
        <p className="mt-1 text-xs text-stone-500">Optional. Applied when you buy a plan.</p>
        <input
          id="coupon-code"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          placeholder="SAVE20"
          autoComplete="off"
          className="mt-3 w-full max-w-sm rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold tracking-wide text-stone-900 outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const popular = plan.duration_months === 3;
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 ${
                popular ? "border-emerald-700 shadow-sm" : "border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-stone-950">{planLabel(plan)}</h2>
                {popular ? (
                  <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
                ) : null}
              </div>
              <p className="mt-6 text-4xl font-semibold text-emerald-900">{inr(plan.price_inr)}</p>
              <p className="mt-2 text-sm text-stone-500">{`${plan.duration_months} ${plan.duration_months === 1 ? "month" : "months"} · one mess`}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-stone-600">
                {planFeatures.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              {seat?.plan_id === plan.id ? (
                <p className="mt-8 rounded-xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-900">Current plan</p>
              ) : (
                <button
                  type="button"
                  disabled={pendingId !== null}
                  onClick={() => buy(plan)}
                  className="mt-8 w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pendingId === plan.id ? "Waiting for payment…" : seat?.subscription ? "Upgrade subscription" : "Buy"}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function loadRazorpay(): Promise<new (options: RazorpayOptions) => { open: () => void }> {
  return new Promise((resolve, reject) => {
    const existing = (window as RazorpayWindow).Razorpay;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const loaded = (window as RazorpayWindow).Razorpay;
      if (loaded) resolve(loaded);
      else reject(new Error("Razorpay did not load."));
    };
    script.onerror = () => reject(new Error("Razorpay did not load."));
    document.body.appendChild(script);
  });
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  readonly?: { email?: boolean };
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
  "payment.failed"?: (failed: { error?: { description?: string; metadata?: { payment_id?: string } } }) => void;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => { open: () => void };
};
