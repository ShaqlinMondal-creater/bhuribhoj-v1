"use client";

import { useEffect, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterSearch, MaterialScope } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { configService, type ConfigRow, type ConfigWrite } from "@/services/configService";
import TextField from "@mui/material/TextField";

export function ConfigsScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<{ mode: "create" | "update" | "delete"; row?: ConfigRow } | null>(null);
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
    configService
      .fetch({ search: search || undefined, limit, offset })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load configs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, limit, offset, reloadKey]);

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="Action" title="Configs" description="Platform keys and values the admin can change." />
        <button
          type="button"
          onClick={() => setOpen({ mode: "create" })}
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add config
        </button>
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Key or note" />
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
            <th className={thClass()}>Key</th>
            <th className={thClass()}>Value</th>
            <th className={thClass()}>Note</th>
            <th className={thClass()}>Updated by</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={5}
          loading={loading && rows.length === 0}
          empty={!loading && rows.length === 0 ? (search ? "No configs match this search." : "No configs yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{row.config_key}</td>
            <td className="max-w-[16rem] truncate px-4 py-3 text-stone-700">{row.config_value || "—"}</td>
            <td className="px-4 py-3 text-stone-600">{row.note || "—"}</td>
            <td className="px-4 py-3 text-stone-600">{row.updater?.name || "—"}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <IconButton label="Update" icon="pencil" onClick={() => setOpen({ mode: "update", row })} />
                <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", row })} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {open?.mode === "create" || open?.mode === "update" ? (
        <ConfigForm
          title={open.mode === "create" ? "Add config" : "Update config"}
          row={open.row}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "delete" && open.row ? (
        <ConfigDelete
          row={open.row}
          onClose={() => setOpen(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else refresh();
          }}
          onFailed={(message) => {
            setError(message);
            setOpen(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ConfigForm({
  title,
  row,
  onClose,
  onSaved,
  onFailed,
}: {
  title: string;
  row?: ConfigRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<ConfigWrite>({
    config_key: row?.config_key ?? "",
    config_value: row?.config_value ?? "",
    note: row?.note ?? "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await configService.save({
        config_key: form.config_key.trim(),
        config_value: form.config_value?.trim() || null,
        note: form.note?.trim() || null,
      });
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not save the config.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3">
          <TextField
            required
            fullWidth
            label="Key"
            value={form.config_key}
            disabled={Boolean(row)}
            helperText="Letters, numbers, dots, dashes, underscores"
            onChange={(event) => setForm({ ...form, config_key: event.target.value })}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Value"
            value={form.config_value ?? ""}
            onChange={(event) => setForm({ ...form, config_value: event.target.value })}
          />
          <TextField fullWidth label="Note" value={form.note ?? ""} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          <button type="submit" disabled={pending} className="mt-1 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function ConfigDelete({
  row,
  onClose,
  onDeleted,
  onFailed,
}: {
  row: ConfigRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await configService.remove(row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the config.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete config" onClose={onClose}>
      <p className="text-sm text-stone-600">Delete {row.config_key}?</p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700">
          Cancel
        </button>
        <button type="button" onClick={onDelete} disabled={pending} className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}
