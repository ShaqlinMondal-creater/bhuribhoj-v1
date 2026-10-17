import { apiClient } from "@/lib/api/client";
import type { LaravelUser } from "@/types/auth";

export type MembersPage = {
  data: LaravelUser[];
  current_page: number;
  last_page: number;
  total: number;
};

export const memberService = {
  fetch(page = 1) {
    return apiClient<MembersPage>(`/members/fetch?page=${page}`);
  },
};
