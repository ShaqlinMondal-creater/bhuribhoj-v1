import users from "@/data/json/users.json";
import type { User } from "@/types/user";

export const getUsers = (): User[] =>
  (users as Array<User & { password: string }>).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.memberId ? { memberId: user.memberId } : {}),
  }));