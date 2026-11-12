"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

const OUTPUT = 192;
const VIEW = 280;

type Props = {
  file: File;
  onClose: () => void;
  onCropped: (dataUrl: string) => void | Promise<void>;
};

export function AvatarCropDialog({ file, onClose, onCropped }: Props) {
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const cover = Math.max(VIEW / image.width, VIEW / image.height);
      setMinZoom(cover);
      setZoom(cover);
      setOffset({ x: 0, y: 0 });
      setSource(image);
    };
    image.onerror = () => setError("That photo could not be read.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clampOffset(next: { x: number; y: number }, scale: number, image: HTMLImageElement) {
    const w = image.width * scale;
    const h = image.height * scale;
    const maxX = Math.max(0, (w - VIEW) / 2);
    const maxY = Math.max(0, (h - VIEW) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!source) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !source) return;
    const next = {
      x: drag.current.ox + (event.clientX - drag.current.x),
      y: drag.current.oy + (event.clientY - drag.current.y),
    };
    setOffset(clampOffset(next, zoom, source));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function changeZoom(value: number) {
    if (!source) return;
    const nextZoom = Math.max(minZoom, value);
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom, source));
  }

  async function save() {
    if (!source) return;
    setPending(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const scale = zoom;
      const drawW = source.width * scale;
      const drawH = source.height * scale;
      const dx = (VIEW - drawW) / 2 + offset.x;
      const dy = (VIEW - drawH) / 2 + offset.y;
      const ratio = OUTPUT / VIEW;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);
      ctx.beginPath();
      ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(source, dx * ratio, dy * ratio, drawW * ratio, drawH * ratio);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      await onCropped(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop this photo.");
      setPending(false);
      return;
    }
    setPending(false);
  }

  return (
    <Dialog title="Crop photo" onClose={onClose} size="md" backdrop="stone">
      <p className="mb-4 text-sm text-stone-600">Drag to position, then zoom. The circle is what people will see.</p>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative touch-none overflow-hidden rounded-full bg-stone-200 shadow-inner"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {source ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: source.width * zoom,
                height: source.height * zoom,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-stone-500">Loading…</p>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80 ring-inset" />
        </div>
        <label className="flex w-full max-w-xs items-center gap-3 text-sm text-stone-600">
          <span className="w-12 shrink-0">Zoom</span>
          <input
            type="range"
            min={minZoom}
            max={Math.max(minZoom * 3, minZoom + 0.01)}
            step={0.01}
            value={zoom}
            disabled={!source}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="w-full accent-emerald-800"
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!source || pending}
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save photo"}
        </button>
      </div>
    </Dialog>
  );
}
