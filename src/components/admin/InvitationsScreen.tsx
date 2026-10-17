"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { invitationService } from "@/services/invitationService";

export function InvitationsScreen() {
  const { data, error, loading } = useApi(invitationService.fetch);
  const rows = data?.data ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Invitations"
        description="Invite a president and attach a subscription plan."
      />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState icon="mail" title="No invitations" description="New mess invitations will list here." />
      ) : null}
      {rows.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-900">{row.mess_name || row.email}</p>
                <p className="text-xs text-stone-500">{row.email}</p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium capitalize text-stone-600">
                {row.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
