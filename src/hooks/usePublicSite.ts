"use client";

import { useEffect, useState } from "react";
import { settingService, type PlatformSettings } from "@/services/settingService";

export type PublicSite = {
  contactEmail: string | null;
  siteName: string;
  siteNameBn: string;
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
  siteNameBn: "ভুরিভোজ",
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
  return {
    contactEmail: email && email.includes("@") ? email : null,
    siteName: data.site_name?.trim() || defaults.siteName,
    siteNameBn: data.site_name_bn?.trim() || defaults.siteNameBn,
    siteBlurb: data.site_blurb?.trim() || defaults.siteBlurb,
    siteCopyright: data.site_copyright?.trim() || defaults.siteCopyright,
    legalPrivacy: data.legal_privacy?.trim() || defaults.legalPrivacy,
    legalTerms: data.legal_terms?.trim() || defaults.legalTerms,
    creditName: data.credit_name?.trim() || defaults.creditName,
    creditUrl: data.credit_url?.trim() || defaults.creditUrl,
  };
}

let cache: PublicSite | null = null;
let inflight: Promise<PublicSite> | null = null;

function loadPublicSite() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = settingService
    .publicFetch()
    .then((result) => {
      cache = mapSettings(result.data);
      return cache;
    })
    .catch(() => {
      cache = defaults;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function usePublicSite() {
  const [site, setSite] = useState<PublicSite>(cache ?? defaults);
  const [ready, setReady] = useState(Boolean(cache));

  useEffect(() => {
    let cancelled = false;
    loadPublicSite().then((next) => {
      if (cancelled) return;
      setSite(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { site, ready };
}
