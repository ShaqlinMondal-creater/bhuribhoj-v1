"use client";

import { usePublicSite } from "@/hooks/usePublicSite";

/** Public contact email from Admin → Configs (`contact.email`). Hidden when empty. */
export function ContactEmailLink({ className }: { className?: string }) {
  const { site, ready } = usePublicSite();
  if (!ready || !site.contactEmail) return null;

  return (
    <a href={`mailto:${site.contactEmail}`} className={className}>
      {site.contactEmail}
    </a>
  );
}
