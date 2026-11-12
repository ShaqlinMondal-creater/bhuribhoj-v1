"use client";

import { useEffect, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
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
        description="Public contact form messages. Open a thread in the bottom-right to update details and reply by email."
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
        <SupportComposePanel
          key={active.id}
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

function SupportComposePanel({
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
  const [name, setName] = useState(inquiry.name);
  const [email, setEmail] = useState(inquiry.email ?? "");
  const [phone, setPhone] = useState(inquiry.phone ?? "");
  const [mess, setMess] = useState(inquiry.mess);
  const [members, setMembers] = useState(String(inquiry.members));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  const detailsDirty =
    name.trim() !== inquiry.name ||
    email.trim() !== (inquiry.email ?? "") ||
    phone.trim() !== (inquiry.phone ?? "") ||
    mess.trim() !== inquiry.mess ||
    Number(members) !== inquiry.members;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveDetails() {
    const memberCount = Number(members);
    if (!name.trim() || !mess.trim() || !Number.isFinite(memberCount) || memberCount < 1) {
      setLocalError("Name, mess, and members are required.");
      return;
    }
    if (email.trim() && !email.includes("@")) {
      setLocalError("Enter a valid email in To.");
      return;
    }
    setPending(true);
    setLocalError(null);
    try {
      const result = await contactSupportService.update({
        id: inquiry.id,
        name: name.trim(),
        mess: mess.trim(),
        members: memberCount,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      onUpdated(result.data, result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save details.";
      setLocalError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    if (email.trim() && !email.includes("@")) {
      setLocalError("Enter a valid email in To.");
      return;
    }
    setPending(true);
    setLocalError(null);
    try {
      if (detailsDirty) {
        const memberCount = Number(members);
        await contactSupportService.update({
          id: inquiry.id,
          name: name.trim(),
          mess: mess.trim(),
          members: Number.isFinite(memberCount) && memberCount > 0 ? memberCount : inquiry.members,
          phone: phone.trim() || null,
          email: email.trim() || null,
        });
      }
      const result = await contactSupportService.reply({
        id: inquiry.id,
        message,
        name: name.trim(),
        email: email.trim() || null,
      });
      setDraft("");
      onUpdated(result.data, result.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send the reply.";
      setLocalError(msg);
      onFailed(msg);
    } finally {
      setPending(false);
    }
  }

  async function setStatus(status: ContactInquiry["status"]) {
    setPending(true);
    setLocalError(null);
    try {
      const result = await contactSupportService.status({ id: inquiry.id, status });
      onUpdated(result.data, result.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update status.";
      setLocalError(msg);
      onFailed(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end p-3 md:p-5">
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Contact support compose"
        className={`pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/20 transition-[height] md:w-[26rem] ${
          minimized ? "h-12" : "h-[min(36rem,calc(100dvh-1.5rem))]"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 bg-stone-950 px-3 py-2.5 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Reply · {name || "Visitor"}</p>
            <p className="truncate text-[11px] text-stone-400">{email || phone || "No recipient yet"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusPill status={inquiry.status} dark />
            <button
              type="button"
              onClick={() => setMinimized((value) => !value)}
              className="rounded-lg px-2 py-1 text-xs text-stone-300 hover:bg-white/10 hover:text-white"
              aria-label={minimized ? "Expand" : "Minimize"}
            >
              {minimized ? "▴" : "–"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xs text-stone-300 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {!minimized ? (
          <>
            <div className="shrink-0 space-y-2 border-b border-stone-100 px-3 py-3">
              <FieldRow label="To">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="visitor@gmail.com"
                  className={composeField}
                />
              </FieldRow>
              <FieldRow label="Name">
                <input value={name} onChange={(event) => setName(event.target.value)} className={composeField} />
              </FieldRow>
              <FieldRow label="Phone">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={composeField} />
              </FieldRow>
              <FieldRow label="Mess">
                <input value={mess} onChange={(event) => setMess(event.target.value)} className={composeField} />
              </FieldRow>
              <FieldRow label="Members">
                <input
                  type="number"
                  min={1}
                  value={members}
                  onChange={(event) => setMembers(event.target.value)}
                  className={composeField}
                />
              </FieldRow>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!detailsDirty || pending}
                  onClick={() => void saveDetails()}
                  className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                >
                  Save details
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-stone-50 px-3 py-3">
              <ChatBubble side="visitor" title={inquiry.name} body={inquiry.message} when={inquiry.created_at} />
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

            <form onSubmit={sendReply} className="shrink-0 border-t border-stone-100 bg-white px-3 py-3">
              {localError ? <p className="mb-2 text-xs text-red-700">{localError}</p> : null}
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                disabled={pending}
                placeholder="Write your reply…"
                className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {inquiry.status !== "closed" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void setStatus("closed")}
                      className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Mark closed
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void setStatus("open")}
                      className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={pending || draft.trim() === ""}
                  className="rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-ink)] disabled:opacity-50"
                >
                  {pending ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}

const composeField =
  "min-w-0 flex-1 border-0 border-b border-stone-200 bg-transparent px-0 py-1 text-sm text-stone-900 outline-none focus:border-[var(--accent)]";

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
        className={`max-w-[92%] rounded-2xl px-3 py-2 shadow-sm ${
          mine ? "bg-emerald-800 text-emerald-50" : "bg-white text-stone-800 ring-1 ring-stone-200"
        }`}
      >
        <p className={`text-[10px] font-semibold ${mine ? "text-emerald-100/80" : "text-stone-500"}`}>
          {title}
          {when ? ` · ${kolkataDateTime(when)}` : ""}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-5">{body}</p>
        {meta ? <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100/70" : "text-stone-400"}`}>{meta}</p> : null}
      </div>
    </article>
  );
}

function StatusPill({ status, dark = false }: { status: ContactInquiry["status"]; dark?: boolean }) {
  const tone = dark
    ? status === "open"
      ? "bg-amber-400/20 text-amber-200"
      : status === "replied"
        ? "bg-sky-400/20 text-sky-200"
        : "bg-white/10 text-stone-300"
    : status === "open"
      ? "bg-amber-100 text-amber-800"
      : status === "replied"
        ? "bg-sky-100 text-sky-800"
        : "bg-stone-200 text-stone-600";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${tone}`}>{status}</span>;
}
