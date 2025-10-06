"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useTeams } from "@/hooks/use-teams"
import { getSidebarData } from "@/data/sidebar-data"

export function AppSidebar({
  teamId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { teamId: string }) {
  const { teams } = useTeams()
  const sidebarData = getSidebarData(teamId)

  const team_list = teams.map((team) => ({
    id: team.id,
    name: team.name,
    logo: GalleryVerticalEnd,
    plan: "Team",
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={team_list}
          activeTeamId={teamId}
          onTeamChange={(t) => {
            window.location.href = `/team/${t.id}`
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
