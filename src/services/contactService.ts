import { apiClient } from "@/lib/api/client";

export type ContactPayload = {
  name: string;
  mess: string;
  members: number;
  phone?: string;
  email?: string;
  message: string;
  /** Honeypot — always leave empty */
  website?: string;
};

export const contactService = {
  send(body: ContactPayload) {
    return apiClient<{ message: string }>("/public/contact", {
      method: "POST",
      auth: false,
      body,
    });
  },
};
