"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return <div className="pagination"><span>{total} records</span><div><button className="pagination-button" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button><strong>{page} / {pages}</strong><button className="pagination-button" disabled={page === pages} onClick={() => onPageChange(page + 1)} aria-label="Next page"><ChevronRight size={15} /></button></div></div>;
}