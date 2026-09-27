import type { Role } from "@/types/user";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  memberId?: string;
  mobile?: string;
  avatarUrl?: string;
};

export type AuthenticatedUser = Omit<DemoUser, "password">;