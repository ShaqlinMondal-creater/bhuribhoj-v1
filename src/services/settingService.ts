import { apiClient } from "@/lib/api/client";
import type { ThemeId } from "@/lib/theme";

export type PlatformSettings = {
  theme: ThemeId;
  contact_email?: string;
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
