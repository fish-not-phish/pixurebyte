export interface User {
  id: string;
  email: string;
}

export type Role = "admin" | "requestor" | "viewer";

export interface MembershipOut {
  team_id: string;
  team_name: string;
  role: Role;
}

export interface UserOut {
  id: string
  email: string
  memberships: MembershipOut[]
}
