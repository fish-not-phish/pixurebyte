"use client";
import { useEffect } from "react";
import { fetchMe } from "@/services/auth";
import { useUserStore } from "@/stores/use-user-store";

export function useCurrentUser() {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      fetchMe()
        .then(setUser)
        .catch(() => setUser(null));
    }
  }, [user, setUser]);

  return { user, setUser };
}
