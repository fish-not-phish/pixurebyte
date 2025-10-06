"use client"
import { useEffect, useState } from "react";
import { fetchTeams } from "@/services/teams";
import { Team } from "@/types/teams";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  return { teams, loading };
}
