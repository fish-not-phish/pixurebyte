"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { searchUsers, inviteMember, createMember } from "@/services/members"
import type { Role } from "@/types/users"
import { UserSearch, Member } from "@/types/members"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { UserPlus, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddMembersForm() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const [users, setUsers] = useState<UserSearch[]>([])
  const [query, setQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserSearch | null>(null)
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<Role>("viewer")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!query) {
      setUsers([])
      return
    }
    searchUsers(query, teamId)
      .then(setUsers)
      .catch(() => {})
  }, [query, teamId])

  async function handleInvite(user: UserSearch) {
    try {
      const invited: Member = await inviteMember(teamId, { email: user.email, role: "viewer" })
      toast.success(`${invited.email} invited successfully as ${invited.role}`)
      setSelectedUser(null)
      setQuery("")
      setUsers([])
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to invite user")
    }
  }

  async function handleCreate() {
    try {
      setCreating(true);
      const res: Member & { password?: string } = await createMember(
        teamId,
        newEmail,
        newRole
      );

      toast.success(`Member ${res.email} created with role ${res.role}`);
      if (res.password) {
        toast.message(`Temporary Password: ${res.password}`);
      }

      setNewEmail("");
      setNewRole("viewer");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create member";
      console.error(err);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Invite Existing User</h3>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between cursor-pointer">
                  {selectedUser ? selectedUser.email : "Search for a user..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400]">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search users by email..."
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.email}
                          onSelect={() => {
                            setSelectedUser(user)
                            setQuery("")
                            setUsers([])
                            setOpen(false)
                          }}
                        >
                          <div className="flex items-center justify-between w-full cursor-pointer">
                            <span>{user.email}</span>
                            {selectedUser?.id === user.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedUser && (
              <Button
                onClick={() => handleInvite(selectedUser)}
                className="w-full cursor-pointer"
              >
                Invite {selectedUser.email}
              </Button>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold">Create New Member</h3>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newuser@example.com"
              />

              <Label>Role</Label>
              <Select value={newRole} onValueChange={(val: Role) => setNewRole(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="requestor">Requestor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreate}
                disabled={!newEmail || creating}
                className="w-full cursor-pointer mt-3"
              >
                {creating ? "Creating..." : "Create Member"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
