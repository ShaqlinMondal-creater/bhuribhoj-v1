import { apiFetch } from "@/lib/api/server";
import { mapLaravelUser, type AuthUser, type LaravelUser, type Plan } from "@/types/auth";

type LoginResponse = {
  token: string;
  token_type: string;
  user: LaravelUser;
};

type MeResponse = {
  user: LaravelUser;
};

export async function loginRequest(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password, device_name: "bhuribhoj-web" },
  });

  return {
    token: data.token,
    user: mapLaravelUser(data.user),
  };
}

export async function fetchCurrentUser(token?: string): Promise<AuthUser> {
  const data = await apiFetch<MeResponse>("/auth/me", {
    method: "GET",
    token,
  });
  return mapLaravelUser(data.user);
}

export async function logoutRequest() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Token may already be invalid; local cookies still clear.
  }
}

export async function fetchPlans(): Promise<Plan[]> {
  const data = await apiFetch<{ data: Plan[] }>("/plans/fetch", {
    auth: false,
    next: { revalidate: 60 },
  });
  return data.data;
}

export async function fetchDashboard() {
  return apiFetch<{
    user: LaravelUser;
    platform?: {
      mess_count: number;
      user_count: number;
      active_mess_count: number;
    } | null;
    mess_totals: {
      total_deposit: number;
      total_expense: number;
      manager_fund: number;
      mess_fund: number;
      balance: number;
    } | null;
    my_totals: {
      total_deposit: number;
      guest_meals_amount: number;
      pending_fines: number;
      pending_dues: unknown[];
    } | null;
  }>("/dashboard/fetch");
}
