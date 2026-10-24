"use client";

import { useEffect, useState } from "react";

const LIMITS = [10, 25, 50];

export function TableShell({
  head,
  children,
  count,
  limit,
  offset,
  onLimit,
  onOffset,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  count: number;
  limit: number;
  offset: number;
  onLimit: (limit: number) => void;
  onOffset: (offset: number) => void;
}) {
  const start = count === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, count);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--accent)] text-sm text-[var(--accent-ink)]">{head}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-stone-100 px-4 py-3 text-sm text-stone-500">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={limit}
            aria-label="Rows per page"
            onChange={(event) => onLimit(Number(event.target.value))}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm text-stone-800"
          >
            {LIMITS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span>
          {start}–{end} of {count}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Previous page"
            disabled={offset === 0}
            onClick={() => onOffset(Math.max(0, offset - limit))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={offset + limit >= count}
            onClick={() => onOffset(offset + limit)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export function useClientPage<T>(items: T[]) {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (offset > 0 && offset >= items.length) setOffset(0);
  }, [items.length, offset]);

  return {
    page: items.slice(offset, offset + limit),
    count: items.length,
    limit,
    offset,
    setLimit: (next: number) => {
      setLimit(next);
      setOffset(0);
    },
    setOffset,
  };
}

export function thClass(align: "left" | "right" = "left") {
  return `px-4 py-3 font-semibold ${align === "right" ? "text-right" : ""}`;
}

export const rowClass = "border-b border-stone-100 last:border-0";

export function TableStatus({
  colSpan,
  loading,
  empty,
}: {
  colSpan: number;
  loading: boolean;
  empty?: string | null;
}) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-10">
          <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
        </td>
      </tr>
    );
  }

  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-stone-500">
          {empty}
        </td>
      </tr>
    );
  }

  return null;
}
