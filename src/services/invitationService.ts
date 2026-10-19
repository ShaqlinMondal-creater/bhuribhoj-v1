import { apiClient } from "@/lib/api/client";

export type InvitationRow = {
  id: number;
  email: string;
  mess_name?: string | null;
  status: string;
  mobile?: string | null;
};

export const invitationService = {
  fetch() {
    return apiClient<{ data: InvitationRow[] }>("/mess-invitations/fetch", { method: "POST", body: {} });
  },
};
