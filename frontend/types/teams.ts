import { User } from "./users";

export interface Team {
  id: string;
  name: string;
}

export interface Membership {
  id: string;
  role: "admin" | "requestor" | "viewer";
  team: Team;
  user: User;
}