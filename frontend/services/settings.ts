import { apiFetch } from "@/lib/api"

export interface SiteSetting {
  allow_registration: boolean
}

export async function getSettings(): Promise<SiteSetting> {
  return apiFetch<SiteSetting>("/users/settings", { method: "GET" })
}

export async function updateSettings(
  allow_registration: boolean
): Promise<SiteSetting> {
  return apiFetch<SiteSetting>("/users/settings", {
    method: "PUT",
    body: JSON.stringify({ allow_registration }),
  })
}
