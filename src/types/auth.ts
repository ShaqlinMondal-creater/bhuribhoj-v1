export type Role = "admin" | "president" | "manager" | "member";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mobile: string | null;
  roomNo: string | null;
  memberCode: string | null;
  status: "active" | "inactive";
  messId: string | null;
  mess: { id: string; name: string; code: string } | null;
};

export type LaravelUser = {
  id: number | string;
  mess_id?: number | null;
  name: string;
  email: string;
  role: Role;
  mobile?: string | null;
  room_no?: string | null;
  member_code?: string | null;
  status?: string;
  mess?: { id: number | string; name: string; code: string } | null;
};

export type Plan = {
  id: number;
  name: string;
  slug: string;
  duration_months: number;
  price_inr: number;
};

export function mapLaravelUser(user: LaravelUser): AuthUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    mobile: user.mobile ?? null,
    roomNo: user.room_no ?? null,
    memberCode: user.member_code ?? null,
    status: user.status === "inactive" ? "inactive" : "active",
    messId: user.mess_id != null ? String(user.mess_id) : null,
    mess: user.mess
      ? {
          id: String(user.mess.id),
          name: user.mess.name,
          code: user.mess.code,
        }
      : null,
  };
}
