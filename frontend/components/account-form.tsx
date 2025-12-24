"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { apiFetch } from "@/lib/api";
import { Team } from "@/types/teams";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserOut } from "@/types/users";
import { changePassword } from "@/services/members";

const accountFormSchema = z.object({
  email: z.string().email(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),

    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountSettingsForm() {
  const { user, setUser } = useCurrentUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
  resolver: zodResolver(passwordFormSchema),
  defaultValues: {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
});

async function onPasswordSubmit(
  data: z.infer<typeof passwordFormSchema>
) {
  try {
    await changePassword(data.currentPassword, data.newPassword);

    toast.success("Password updated successfully");
    passwordForm.reset();
  } catch (err) {
    console.error(err);
    toast.error("Failed to update password");
  }
}

  useEffect(() => {
    async function load() {
      try {
        if (user) form.reset({ email: user.email });
        const teamsRes = await apiFetch<Team[]>("/users/teams");
        setTeams(teamsRes);
      } catch (err) {
        console.error("Failed to fetch teams", err);
        toast.error("Failed to load account info");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [form, user]);

  async function onSubmit(data: AccountFormValues) {
    try {
      const updated = await apiFetch<UserOut>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ email: data.email }),
      });

      toast.success("Email updated successfully");
      setUser(updated);
    } catch (err) {
      console.error("Failed to update email", err);
      toast.error("Could not update email");
    }
  }

  const roleVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "editor":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const teamRoles = useMemo(() => {
    const map = new Map<string, string>();
    user?.memberships.forEach((m) => map.set(m.team_id, m.role));
    return map;
  }, [user?.memberships]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>

        <Separator />

        <Card className="max-w-md">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="rounded-md border divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="text-muted-foreground">
          Update your account information and view your current permissions.
        </p>
      </div>

      <Separator />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the email tied to your account login.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="cursor-pointer">
                Update Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Update Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Teams & Permissions</h3>

        {teams.length > 0 ? (
          <div className="rounded-md border divide-y">
            {teams.map((team) => {
              const role = teamRoles.get(team.id);
              return (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {getInitials(team.name || "T")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {team.id}
                      </p>
                    </div>
                  </div>

                  <Badge variant={roleVariant(role)} className="capitalize">
                    {role ?? "unknown"}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground">No teams found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
