"use client";

import { useEffect, useState } from "react";
import { settingService } from "@/services/settingService";

/** Shows the public contact address; upgrades from API CONTACT_INBOX when available. */
export function ContactEmailLink({
  fallback,
  className,
}: {
  fallback: string;
  className?: string;
}) {
  const [email, setEmail] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    settingService
      .publicFetch()
      .then((result) => {
        const next = result.data.contact_email?.trim();
        if (!cancelled && next && next.includes("@")) setEmail(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}
