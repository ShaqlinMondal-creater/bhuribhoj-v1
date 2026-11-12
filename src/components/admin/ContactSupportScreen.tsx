"use client";

import { useEffect, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { kolkataDateTime } from "@/lib/format";
import {
  contactSupportService,
  type ContactInquiry,
} from "@/services/contactSupportService";

export function ContactSupportScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ContactInquiry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<ContactInquiry | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    contactSupportService
      .fetch({
        search: search || undefined,
        status: status || undefined,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load contact support.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, status, limit, offset, reloadKey]);

  const filtered = search !== "" || status !== "";

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Action"
        title="Contact support"
        description="Public contact form messages. Reply by email when the visitor left an address."
      />
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Name, mess, email, phone" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All" },
            { value: "open", label: "Open" },
            { value: "replied", label: "Replied" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </FilterBar>
      <TableShell
        count={count}
        limit={limit}
        offset={offset}
        onLimit={(value) => {
          setLimit(value);
          setOffset(0);
        }}
        onOffset={setOffset}
        head={
          <tr>
            <th className={thClass()}>When</th>
            <th className={thClass()}>Visitor</th>
            <th className={thClass()}>Mess</th>
            <th className={thClass()}>Status</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={5}
          loading={loading && rows.length === 0}
          empty={!loading && !error && count === 0 ? (filtered ? "No inquiries match these filters." : "No contact messages yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 text-stone-600">{row.created_at ? kolkataDateTime(row.created_at) : "—"}</td>
            <td className="px-4 py-3">
              <p className="font-medium text-stone-950">{row.name}</p>
              <p className="text-xs text-stone-500">{row.email || row.phone || "No contact"}</p>
            </td>
            <td className="px-4 py-3 text-stone-700">
              {row.mess}
              <span className="block text-xs text-stone-400">{row.members} members</span>
            </td>
            <td className="px-4 py-3">
              <StatusPill status={row.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <IconButton label="Open chat" icon="mail" onClick={() => setActive(row)} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {active ? (
        <SupportChatDialog
          inquiry={active}
          onClose={() => setActive(null)}
          onUpdated={(next, message) => {
            setActive(next);
            setNotice(message);
            setError(null);
            setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
          }}
        />
      ) : null}
    </section>
  );
}

function SupportChatDialog({
  inquiry,
  onClose,
  onUpdated,
  onFailed,
}: {
  inquiry: ContactInquiry;
  onClose: () => void;
  onUpdated: (row: ContactInquiry, message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const canEmail = Boolean(inquiry.email && inquiry.email.includes("@"));

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setPending(true);
    try {
      const result = await contactSupportService.reply({ id: inquiry.id, message });
      setDraft("");
      onUpdated(result.data, result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not send the reply.");
    } finally {
      setPending(false);
    }
  }

  async function setStatus(status: ContactInquiry["status"]) {
    setPending(true);
    try {
      const result = await contactSupportService.status({ id: inquiry.id, status });
      onUpdated(result.data, result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Contact support" onClose={onClose} size="lg" backdrop="stone">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-950">{inquiry.name}</p>
            <p className="text-xs text-stone-500">
              {inquiry.mess} · {inquiry.members} members
              {inquiry.created_at ? ` · ${kolkataDateTime(inquiry.created_at)}` : ""}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {inquiry.email || "No email"}
              {inquiry.phone ? ` · ${inquiry.phone}` : ""}
            </p>
          </div>
          <StatusPill status={inquiry.status} />
        </div>

        <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <ChatBubble
            side="visitor"
            title={inquiry.name}
            body={inquiry.message}
            when={inquiry.created_at}
          />
          {inquiry.replies.map((reply) => (
            <ChatBubble
              key={reply.id}
              side="support"
              title={reply.sender?.name ?? "Support"}
              body={reply.body}
              when={reply.created_at}
              meta={reply.emailed_to ? `Emailed to ${reply.emailed_to}` : undefined}
            />
          ))}
        </div>

        {!canEmail ? (
          <Notice>This visitor left no email. Reply by phone if they shared a number.</Notice>
        ) : null}

        <form onSubmit={sendReply} className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Reply</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              disabled={!canEmail || pending}
              placeholder={canEmail ? "Write a reply — it will be emailed to the visitor." : "No email on this inquiry"}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 disabled:bg-stone-50"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {inquiry.status !== "closed" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void setStatus("closed")}
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Mark closed
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void setStatus("open")}
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Reopen
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!canEmail || pending || draft.trim() === ""}
              className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send reply email"}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

function ChatBubble({
  side,
  title,
  body,
  when,
  meta,
}: {
  side: "visitor" | "support";
  title: string;
  body: string;
  when: string | null;
  meta?: string;
}) {
  const mine = side === "support";
  return (
    <article className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
          mine ? "bg-emerald-800 text-emerald-50" : "bg-white text-stone-800 ring-1 ring-stone-200"
        }`}
      >
        <p className={`text-[11px] font-semibold ${mine ? "text-emerald-100/80" : "text-stone-500"}`}>
          {title}
          {when ? ` · ${kolkataDateTime(when)}` : ""}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{body}</p>
        {meta ? <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100/70" : "text-stone-400"}`}>{meta}</p> : null}
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: ContactInquiry["status"] }) {
  const tone =
    status === "open"
      ? "bg-amber-100 text-amber-800"
      : status === "replied"
        ? "bg-sky-100 text-sky-800"
        : "bg-stone-200 text-stone-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}
