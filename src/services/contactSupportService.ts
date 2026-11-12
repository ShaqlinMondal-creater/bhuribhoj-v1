import { apiClient } from "@/lib/api/client";

export type ContactReply = {
  id: number;
  body: string;
  emailed_to: string | null;
  created_at: string | null;
  sender: { id: number; name: string } | null;
};

export type ContactInquiry = {
  id: number;
  name: string;
  mess: string;
  members: number;
  phone: string | null;
  email: string | null;
  message: string;
  status: "open" | "replied" | "closed";
  ip: string | null;
  created_at: string | null;
  updated_at: string | null;
  replies: ContactReply[];
};

export const contactSupportService = {
  fetch(body: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
    return apiClient<{ data: ContactInquiry[]; count: number }>("/admin/contact-support/fetch", {
      method: "POST",
      body,
    });
  },
  update(body: {
    id: number;
    name?: string;
    mess?: string;
    members?: number;
    phone?: string | null;
    email?: string | null;
  }) {
    return apiClient<{ message: string; data: ContactInquiry }>("/admin/contact-support/update", {
      method: "POST",
      body,
    });
  },
  reply(body: { id: number; message: string; email?: string | null; name?: string }) {
    return apiClient<{ message: string; data: ContactInquiry }>("/admin/contact-support/reply", {
      method: "POST",
      body,
    });
  },
  status(body: { id: number; status: "open" | "replied" | "closed" }) {
    return apiClient<{ message: string; data: ContactInquiry }>("/admin/contact-support/status", {
      method: "POST",
      body,
    });
  },
};
