import { apiClient } from "@/lib/api/client";
import type { LaravelUser } from "@/types/auth";

export type MemberFilters = {
  search?: string;
  role?: "president" | "manager" | "member" | "";
  status?: "active" | "inactive" | "";
  room_no?: string;
  limit?: number;
  offset?: number;
};

export type MembersPage = {
  data: LaravelUser[];
  count: number;
  limit: number;
  offset: number;
  rooms: string[];
};

export type NewMember = {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  room_no?: string;
};

export const memberService = {
  fetch(filters: MemberFilters = {}) {
    const body: MemberFilters = {
      limit: filters.limit ?? 10,
      offset: filters.offset ?? 0,
    };
    if (filters.search?.trim()) body.search = filters.search.trim();
    if (filters.role) body.role = filters.role;
    if (filters.status) body.status = filters.status;
    if (filters.room_no) body.room_no = filters.room_no;

    return apiClient<MembersPage>("/members/fetch", { method: "POST", body });
  },
  create(body: NewMember) {
    return apiClient<{ message: string }>(`/members/create`, { method: "POST", body });
  },
  update(body: {
    user_id: number;
    name: string;
    mobile?: string;
    room_no?: string;
    status: "active" | "inactive";
  }) {
    return apiClient<{ message: string }>("/members/update", { method: "POST", body });
  },
};
