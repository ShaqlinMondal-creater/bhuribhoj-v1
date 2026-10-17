import { apiFetch } from "@/lib/api/server";
import type { LaravelUser } from "@/types/auth";

export type MembersPage = {
  data: LaravelUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export async function fetchMembers(page = 1) {
  return apiFetch<MembersPage>(`/members/fetch?page=${page}`);
}

export type MessRecord = {
  id: number;
  name: string;
  code: string;
  address: string;
  district: string;
  pincode: string;
  contact_no: string;
  email: string;
  fund_mode: string;
  is_active: boolean;
};

export async function fetchMesses() {
  return apiFetch<{
    data?: MessRecord[];
    current_page?: number;
    total?: number;
  } | MessRecord>("/messes/fetch");
}
