import { apiClient } from "@/lib/api/client";
import type { ThemeId } from "@/lib/theme";

export type PlatformSettings = {
  theme: ThemeId;
  contact_email?: string | null;
  site_name?: string;
  site_name_bn?: string;
  site_blurb?: string;
  site_copyright?: string;
  legal_privacy?: string;
  legal_terms?: string;
  credit_name?: string;
  credit_url?: string;
};

export const settingService = {
  publicFetch() {
    return apiClient<{ data: PlatformSettings }>("/public/settings/fetch", {
      method: "POST",
      body: {},
      auth: false,
    });
  },
  fetch() {
    return apiClient<{ data: PlatformSettings }>("/admin/settings/fetch", {
      method: "POST",
      body: {},
    });
  },
  save(body: { theme: ThemeId }) {
    return apiClient<{ message: string; data: PlatformSettings }>("/admin/settings/save", {
      method: "POST",
      body,
    });
  },
};
