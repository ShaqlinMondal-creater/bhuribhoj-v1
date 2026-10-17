"use client";

import { useMessUser } from "@/components/auth/MessSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { roleLabel } from "@/lib/auth/roles";
import { initials } from "@/lib/format";
import { memberService } from "@/services/memberService";
import type { Role } from "@/types/auth";

export function MembersScreen() {
  const user = useMessUser();
  const allowed = user != null && user.role !== "member";
  const { data, error, loading } = useApi(() => memberService.fetch(1), allowed);
  const rows = data?.data ?? [];

  if (user?.role === "member") {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="People"
          title="Members"
          description="Only the president and managers can view the member list."
        />
        <EmptyState
          icon="users"
          title="Restricted"
          description="Ask the president if you need a change to the roster."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Members"
        description="President, managers, and members in this mess."
      />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-64 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState icon="users" title="No members yet" description="People added to this mess will show up here." />
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
          <div className="hidden grid-cols-12 gap-3 border-b border-stone-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400 md:grid">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Code</div>
            <div className="col-span-2">Room</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
          </div>
          <ul>
            {rows.map((row) => (
              <li
                key={String(row.id)}
                className="grid grid-cols-1 gap-2 border-b border-stone-100 px-5 py-4 last:border-0 md:grid-cols-12 md:items-center md:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3 md:col-span-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-900">
                    {initials(row.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-900">{row.name}</p>
                    <p className="truncate text-xs text-stone-500">{row.email}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 md:col-span-2">{row.member_code ?? "—"}</p>
                <p className="text-sm text-stone-600 md:col-span-2">{row.room_no ?? "—"}</p>
                <div className="md:col-span-2">
                  <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {roleLabel[row.role as Role] ?? row.role}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-800">
                    {row.status ?? "active"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
