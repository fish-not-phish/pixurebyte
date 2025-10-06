import {
  LayoutDashboard,
  Settings2,
  User,
  Palette,
  ShieldCheck,
  LucideIcon,
  UserPlus,
  Search,
  Zap,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavItem[]
}

export function getSidebarData(teamId: string): { navMain: NavItem[] } {
  return {
    navMain: [
      {
        title: "Home",
        url: `/team/${teamId}`,
        icon: LayoutDashboard,
      },
      {
        title: "Scan",
        url: `/team/${teamId}/scan`,
        icon: Zap,
      },
      {
        title: "Search",
        url: `/team/${teamId}/search`,
        icon: Search,
      },
      {
        title: "Settings",
        url: `/team/${teamId}/settings`,
        icon: Settings2,
        items: [
          {
            title: "Account",
            url: `/team/${teamId}/settings/account`,
            icon: User,
          },
          {
            title: "Appearance",
            url: `/team/${teamId}/settings/appearance`,
            icon: Palette,
          },
          {
            title: "Add Members",
            url: `/team/${teamId}/settings/add-members`,
            icon: UserPlus,
          },
          {
            title: "Admin",
            url: `/team/${teamId}/settings/admin`,
            icon: ShieldCheck,
          },
        ],
      },
    ],
  }
}
