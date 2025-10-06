import { create } from "zustand";
import type { UserOut } from "@/types/users";

type UserStore = {
  user: UserOut | null;
  setUser: (u: UserOut | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
