"use client"

import { use } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/sidebar-nav"
import { Palette, Shield, UserPlus, User } from "lucide-react"
import AddMembersForm from "@/components/add-member-form"

export default function SettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params) 

  const sidebarNavItems = [
    {
      title: "Account",
      href: `/team/${teamId}/settings/account`,
      icon: <User size={18} />,
    },
    {
      title: "Appearance",
      href: `/team/${teamId}/settings/appearance`,
      icon: <Palette size={18} />,
    },
    {
      title: "Add Members",
      href: `/team/${teamId}/settings/add-members`,
      icon: <UserPlus size={18} />,
    },
    {
      title: "Admin",
      href: `/team/${teamId}/settings/admin`,
      icon: <Shield size={18} />,
    },
  ]

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences for this team.
          </p>
        </div>

        <Separator className="my-4 lg:my-6" />

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>

          <div className="flex-1 p-2">
            <AddMembersForm />
          </div>
        </div>
      </div>
    </main>
  )
}
