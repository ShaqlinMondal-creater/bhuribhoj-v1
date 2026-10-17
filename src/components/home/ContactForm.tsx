"use client";

import { useState } from "react";

const field =
  "mt-2 w-full rounded-2xl border border-[#e2b657]/30 bg-black px-4 py-3 text-sm text-[#f7f1e4] outline-none focus:border-[#e2b657]";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-[1.25rem] border border-[#e2b657]/40 px-4 py-5 text-sm leading-7 text-[#f7f1e4]">
        Received. This note stays on the page for now. A live inbox connects here next.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block text-xs uppercase tracking-[0.18em] text-[#e2b657]">
        Name
        <input required name="name" className={field} />
      </label>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#e2b657]">
        Email
        <input required type="email" name="email" className={field} />
      </label>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#e2b657]">
        Mess
        <input name="mess" className={field} />
      </label>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#e2b657]">
        Note
        <textarea required name="message" rows={4} className={field} />
      </label>
      <button type="submit" className="rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black">
        Send
      </button>
    </form>
  );
}
