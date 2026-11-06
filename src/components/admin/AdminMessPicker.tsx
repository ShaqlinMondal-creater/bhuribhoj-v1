"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { useApi } from "@/hooks/useApi";
import { readAdminMessId, writeAdminMessId } from "@/lib/adminMess";
import type { MessRecord } from "@/lib/api/mess";
import { messService } from "@/services/messService";

export function AdminMessPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const messes = useApi(messService.fetch);
  const rows = normalizeMesses(messes.data).filter((mess) => mess.is_active);

  useEffect(() => {
    if (value != null || rows.length === 0) return;
    const saved = readAdminMessId();
    if (saved && rows.some((mess) => mess.id === saved)) onChange(saved);
  }, [value, rows, onChange]);

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/5">
      <label className="block text-sm font-medium text-stone-700" htmlFor="admin-mess">
        Mess
      </label>
      <p className="mt-1 text-xs text-stone-500">Admin meal tools need one mess selected.</p>
      {messes.error ? <div className="mt-3"><Notice>{messes.error}</Notice></div> : null}
      <select
        id="admin-mess"
        className="mt-3 w-full max-w-md rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[var(--accent)]"
        value={value ?? ""}
        disabled={messes.loading}
        onChange={(event) => {
          const next = event.target.value ? Number(event.target.value) : null;
          writeAdminMessId(next);
          onChange(next);
        }}
      >
        <option value="">{messes.loading ? "Loading messes…" : "Choose a mess"}</option>
        {rows.map((mess) => (
          <option key={mess.id} value={mess.id}>
            {mess.name} · {mess.code}
          </option>
        ))}
      </select>
      {!messes.loading && rows.length === 0 ? <p className="mt-2 text-sm text-stone-500">No active messes yet.</p> : null}
    </div>
  );
}

export function useAdminMessId() {
  const [messId, setMessId] = useState<number | null>(null);

  useEffect(() => {
    setMessId(readAdminMessId());
  }, []);

  return [messId, setMessId] as const;
}

function normalizeMesses(payload: { data?: MessRecord[] } | MessRecord | null): MessRecord[] {
  if (!payload) return [];
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("id" in payload) return [payload];
  return [];
}
