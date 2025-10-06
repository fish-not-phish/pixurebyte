import { create } from "zustand"
import { Team } from "@/types/teams"

type TeamStore = {
  teams: Team[]
  activeTeamId: string | null
  setTeams: (t: Team[]) => void
  setActiveTeam: (t: Team) => void
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  activeTeamId: null,
  setTeams: (teams) => set({ teams }),
  setActiveTeam: (team) => set({ activeTeamId: team.id }),
}))
