import { apiClient } from "@/lib/api/client";
import { mapLaravelUser, type AuthUser, type LaravelUser } from "@/types/auth";

type LoginResponse = {
  token: string;
  token_type: string;
  user: LaravelUser;
};

type MeResponse = {
  user: LaravelUser;
};

export const authService = {
  async login(email: string, password: string) {
    const data = await apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password, device_name: "bhuribhoj-web" },
    });

    return {
      token: data.token,
      user: mapLaravelUser(data.user),
    };
  },

  async currentUser(): Promise<AuthUser> {
    const data = await apiClient<MeResponse>("/auth/me");
    return mapLaravelUser(data.user);
  },

  logout() {
    return apiClient<{ message: string }>("/auth/logout", { method: "POST" });
  },
};
