import { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarSearch } from "@/components/sidebar-search"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { HeaderUser } from "@/components/header-user"

export default async function TeamLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  return (
    <SidebarProvider>
      <AppSidebar teamId={teamId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <SidebarSearch />
          </div>

          <div className="flex items-center gap-4 px-4">
            <ThemeSwitcher />
            <HeaderUser />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-8 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
