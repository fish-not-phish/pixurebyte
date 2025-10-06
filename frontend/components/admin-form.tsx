"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  listMembers,
  removeMember,
  updateMember,
} from "@/services/members"
import { getSettings, updateSettings } from "@/services/settings"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MemberOut } from "@/types/members"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Role } from "@/types/users"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function AdminSettingsForm() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const { user: currentUser } = useCurrentUser()
  const [members, setMembers] = useState<MemberOut[]>([])
  const [loading, setLoading] = useState(true)
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const membership = currentUser?.memberships.find((m) => m.team_id === teamId)
  const isAdmin = membership?.role === "admin"

  // --- Load Members ---
  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await listMembers(teamId)
        setMembers(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load members")
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [teamId])

  // --- Load Registration Settings ---
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings()
        setAllowRegistration(settings.allow_registration)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load site settings")
      } finally {
        setSettingsLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function toggleRegistration(value: boolean) {
    setAllowRegistration(value)
    try {
      await updateSettings(value)
      toast.success("Registration setting updated")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update registration setting")
    }
  }

  async function changeRole(memberId: string, role: Role) {
    try {
      const updated = await updateMember(teamId, memberId, role)
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? updated : m))
      )
      toast.success("Role updated")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update role")
    }
  }

  function roleBadge(role: string) {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-600 text-white">Admin</Badge>
      case "requestor":
        return <Badge className="bg-green-600 text-white">Requestor</Badge>
      case "viewer":
        return <Badge className="bg-gray-600 text-white">Viewer</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  if (loading || settingsLoading) {
    return (
      <div className="p-6 flex flex-col items-center gap-6">
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle>Loading Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-1/3 mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-[160px] rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      {/* Global Registration Settings Toggle */}
      {isAdmin && (
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle>Global Registration Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label
              htmlFor="registration-toggle"
              className="text-base font-medium"
            >
              Allow new user sign-ups
            </Label>
            <Switch
              id="registration-toggle"
              checked={allowRegistration}
              onCheckedChange={toggleRegistration}
            />
          </CardContent>
        </Card>
      )}

      {/* Organization Members */}
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{m.email}</span>
                  <div className="mt-1">{roleBadge(m.role)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={m.role}
                    onValueChange={(role) => changeRole(m.id, role as Role)}
                    disabled={m.id === currentUser?.id || !isAdmin}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="requestor">Requestor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  {isAdmin && currentUser?.id !== m.id && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={async () => {
                        try {
                          await removeMember(teamId, m.id)
                          setMembers((prev) =>
                            prev.filter((u) => u.id !== m.id)
                          )
                          toast.success("User removed")
                        } catch (err) {
                          console.error(err)
                          toast.error("Failed to remove user")
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
