"use client"

import * as React from "react"
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getSidebarData } from "@/data/sidebar-data"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useParams } from "next/navigation"

export function SidebarSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const sidebarData = getSidebarData(teamId)

  const allItems = React.useMemo(() => {
    return sidebarData.navMain.flatMap((item) => {
      const parent = {
        title: item.title,
        url: item.url,
        icon: item.icon,
      };

      const children =
        item.items?.map((sub) => ({
          title: `${item.title} → ${sub.title}`,
          url: sub.url,
          icon: sub.icon ?? item.icon,
        })) || [];

      return [parent, ...children];
    });
  }, [sidebarData.navMain]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex w-64 items-center justify-between rounded-lg border px-3 py-2 text-sm text-muted-foreground text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
        <div className="flex items-center">
            <Search className="mr-2 size-4 text-muted-foreground" />
            <span>Search</span>
        </div>
        <kbd className="pointer-events-none inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
            ⌘ K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 shadow-lg">
        
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search" />
            <CommandList>
              <CommandGroup heading="Navigation">
                {allItems.map((entry) => (
                  <CommandItem
                    key={entry.title}
                    value={entry.title}
                    onSelect={() => {
                      setOpen(false)
                      router.push(entry.url)
                    }}
                    className="flex items-center gap-2"
                  >
                    {entry.icon && <entry.icon className="size-4" />}
                    <span>{entry.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
