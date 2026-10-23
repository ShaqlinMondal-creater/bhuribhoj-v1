import { apiClient } from "@/lib/api/client";
import type { Role } from "@/types/auth";

export type PlatformUser = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  room_no: string | null;
  member_code: string | null;
  role: Role;
  status: string;
  joining_date: string | null;
  mess: { id: number; name: string } | null;
};

export type UserQuery = {
  search?: string;
  role?: string;
  status?: string;
  limit: number;
  offset: number;
};

export type UserList = {
  data: PlatformUser[];
  count: number;
  limit: number;
  offset: number;
};

export type UserWrite = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  role: Role;
  status: string;
};

export const userService = {
  fetch(query: UserQuery) {
    return apiClient<UserList>("/admin/users/fetch", { method: "POST", body: query });
  },
  update(body: UserWrite) {
    return apiClient<{ message: string; data: PlatformUser }>("/admin/users/update", {
      method: "POST",
      body,
    });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/users/${id}/delete`, { method: "DELETE" });
  },
};
