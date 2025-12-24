import { apiFetch } from "@/lib/api";
import type { Member, UserSearch } from "@/types/members";
import type { Role } from "@/types/users";

export async function listMembers(teamId: string): Promise<Member[]> {
  return apiFetch<Member[]>(`/users/team/${teamId}/members`, { method: "GET" });
}

export async function updateMember(
  teamId: string,
  userId: string,
  role: Role
): Promise<Member> {
  return apiFetch<Member>(`/users/team/${teamId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(teamId: string, userId: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/users/team/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function searchUsers(q: string, teamId: string): Promise<UserSearch[]> {
  const qs = new URLSearchParams({ q }).toString();
  return apiFetch<UserSearch[]>(`/users/team/${teamId}/search-users?${qs}`, { method: "GET" });
}

export async function inviteMember(
  teamId: string,
  payload: { email: string; role: Role }
): Promise<Member> {
  return apiFetch<Member>(`/users/team/${teamId}/invite`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMember(
  teamId: string,
  email: string,
  role: Role
): Promise<Member & { password: string }> {
  return apiFetch<Member & { password: string }>(
    `/users/team/${teamId}/create-member`,
    {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }
  );
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/users/me/password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}