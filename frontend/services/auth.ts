import { apiFetch } from "@/lib/api";
import type { User, UserOut } from "@/types/users";

export interface LoginIn {
  email: string;
  password: string;
}

export interface LoginOut {
  access: string;
  refresh: string;
}

export async function login(payload: LoginIn): Promise<LoginOut> {
  return apiFetch<LoginOut>("/token/pair", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(data: {
  email: string;
  password: string;
}): Promise<User> {
  return apiFetch<User>("/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchMe(): Promise<UserOut> {
  return apiFetch<UserOut>("/users/me", {
    method: "GET",
  });
}

export function logoutAndRedirect() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  }
}
