export const paymentStatusLabel: Record<string, string> = {
  created: "Created",
  failed: "Failed",
  paid: "Paid",
};

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
      : status === "failed"
        ? "bg-red-600 text-white"
        : "bg-amber-500 text-white";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {paymentStatusLabel[status] ?? status}
    </span>
  );
}
