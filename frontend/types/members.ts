import type { Role } from "@/types/users";

export interface Member {
  id: string;
  email: string;
  role: Role;
}

export interface UserSearch {
  id: string;
  email: string;
}

export interface MembershipOut {
  team_id: string
  team_name: string
  role: Role
}

export interface MemberOut {
  id: string
  email: string
  role: Role
}
