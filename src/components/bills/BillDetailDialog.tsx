"use client";

import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { paymentStatusLabel } from "@/components/ui/StatusPill";
import { inr, kolkataDateTime } from "@/lib/format";
import type { PaymentRow } from "@/services/paymentService";

export function BillDetailDialog({
  row,
  onClose,
  showSubscription = false,
}: {
  row: PaymentRow;
  onClose: () => void;
  showSubscription?: boolean;
}) {
  const lines: Array<[string, string]> = [
    ["Who", row.user?.name ?? "—"],
    ["Email", row.user?.email ?? "—"],
    ["Plan", row.plan ? `${row.plan.name} · ${row.plan.duration_months} month${row.plan.duration_months > 1 ? "s" : ""}` : "—"],
    ["Amount", inr(row.amount_inr)],
    ["Status", paymentStatusLabel[row.status] ?? row.status],
    ["Order", row.razorpay_order_id],
    ["Payment", row.razorpay_payment_id || "—"],
  ];

  if (showSubscription) {
    lines.push(["Subscription", row.mess_subscription_id ? String(row.mess_subscription_id) : "—"]);
  }

  lines.push(["Failure", row.failure_reason || "—"], ["When", row.created_at ? kolkataDateTime(row.created_at) : "—"]);

  return (
    <Dialog title="Bill detail" onClose={onClose}>
      <DetailList rows={lines} />
    </Dialog>
  );
}
