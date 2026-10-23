import { apiClient } from "@/lib/api/client";
import { mapLaravelUser, type AccountSeat, type AuthUser, type LaravelUser } from "@/types/auth";

type LoginResponse = {
  token: string;
  token_type: string;
  user: LaravelUser;
  seat: AccountSeat;
};

type MeResponse = {
  user: LaravelUser;
  seat: AccountSeat;
};

function sessionFrom(data: LoginResponse) {
  return {
    token: data.token,
    user: mapLaravelUser(data.user),
    seat: data.seat,
  };
}

export const authService = {
  async login(email: string, password: string) {
    const data = await apiClient<LoginResponse>("/public/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password, device_name: "bhuribhoj-web" },
    });

    return sessionFrom(data);
  },

  registerEmail(email: string) {
    return apiClient<{ message: string }>("/public/auth/register/email", {
      method: "POST",
      auth: false,
      body: { email },
    });
  },

  registerPreview(token: string) {
    return apiClient<{ email: string; expires_at: string }>("/public/auth/register/preview", {
      method: "POST",
      auth: false,
      body: { token },
    });
  },

  async registerComplete(body: { token: string; mobile: string; password: string; password_confirmation: string }) {
    const data = await apiClient<LoginResponse>("/public/auth/register/complete", {
      method: "POST",
      auth: false,
      body: { ...body, device_name: "bhuribhoj-web" },
    });

    return sessionFrom(data);
  },

  async currentUser(): Promise<{ user: AuthUser; seat: AccountSeat }> {
    const data = await apiClient<MeResponse>("/authorize/auth/me");
    return { user: mapLaravelUser(data.user), seat: data.seat };
  },

  async updateProfile(body: {
    name: string;
    email: string;
    mobile?: string;
    password?: string;
    password_confirmation?: string;
    avatar?: string | null;
  }) {
    const data = await apiClient<{ user: LaravelUser; message: string }>("/authorize/auth/profile", {
      method: "POST",
      body,
    });
    return mapLaravelUser(data.user);
  },

  logout() {
    return apiClient<{ message: string }>("/authorize/auth/logout", { method: "POST" });
  },
};
