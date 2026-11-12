"use client";

import { useEffect, useState } from "react";
import { settingService, type PlatformSettings } from "@/services/settingService";

export type PublicSite = {
  contactEmail: string | null;
  siteName: string;
  siteNameBn: string | null;
  siteBlurb: string;
  siteCopyright: string;
  legalPrivacy: string;
  legalTerms: string;
  creditName: string;
  creditUrl: string;
};

const defaults: PublicSite = {
  contactEmail: null,
  siteName: "BhuriBhoj",
  siteNameBn: null,
  siteBlurb: "A private ledger and kitchen book for the mess. Meals, money, and members, held in one house.",
  siteCopyright: "© 2026 BhuriBhoj",
  legalPrivacy: "Privacy. A mess ledger is visible to the people of that house, and to the platform admin who keeps the subscriptions.",
  legalTerms: "Terms. One subscription covers one mess, for a month, a semester, or a year. The president opens it.",
  creditName: "liwaas.com",
  creditUrl: "https://liwaas.com",
};

function mapSettings(data: PlatformSettings | undefined): PublicSite {
  if (!data) return defaults;
  const email = data.contact_email?.trim() ?? "";
  // API null/"" means hidden — never fall back to a default Bengali name.
  const bengaliRaw = data.site_name_bn;
  const bengali = typeof bengaliRaw === "string" ? bengaliRaw.trim() : "";
  return {
    contactEmail: email && email.includes("@") ? email : null,
    siteName: data.site_name?.trim() || defaults.siteName,
    siteNameBn: bengali || null,
    siteBlurb: data.site_blurb?.trim() || defaults.siteBlurb,
    siteCopyright: data.site_copyright?.trim() || defaults.siteCopyright,
    legalPrivacy: data.legal_privacy?.trim() || defaults.legalPrivacy,
    legalTerms: data.legal_terms?.trim() || defaults.legalTerms,
    creditName: data.credit_name?.trim() || defaults.creditName,
    creditUrl: data.credit_url?.trim() || defaults.creditUrl,
  };
}

export function usePublicSite() {
  const [site, setSite] = useState<PublicSite>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingService
      .publicFetch()
      .then((result) => {
        if (cancelled) return;
        setSite(mapSettings(result.data));
      })
      .catch(() => {
        if (cancelled) return;
        setSite(defaults);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { site, ready };
}
