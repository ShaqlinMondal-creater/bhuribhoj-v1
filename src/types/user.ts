export type Role = "admin" | "manager" | "president" | "member";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberId?: string;
};