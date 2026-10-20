import { apiFetch } from "@/lib/api/server";
import type { LaravelUser } from "@/types/auth";

export type MembersPage = {
  data: LaravelUser[];
  count: number;
  limit: number;
  offset: number;
  rooms: string[];
};

export async function fetchMembers(body: { limit?: number; offset?: number } = {}) {
  return apiFetch<MembersPage>("/members/fetch", { method: "POST", body });
}

export type FundType = "manager_only" | "mess_and_manager";

export type MessRecord = {
  id: number;
  name: string;
  code: string;
  address: string;
  district: string;
  pincode: string;
  contact_no: string;
  email: string | null;
  fund_type: FundType;
  is_active: boolean;
};

export async function fetchMesses() {
  return apiFetch<{
    data?: MessRecord[];
    current_page?: number;
    total?: number;
  } | MessRecord>("/messes/fetch", { method: "POST", body: {} });
}
