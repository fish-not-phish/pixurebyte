import { apiFetch } from "@/lib/api";
import { Team } from "@/types/teams";

export async function fetchTeams(): Promise<Team[]> {
  return apiFetch<Team[]>("/users/teams", {
    method: "GET",
  });
}

export async function createTeam(data: { name: string }): Promise<Team> {
  return apiFetch<Team>("/users/team/create", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}