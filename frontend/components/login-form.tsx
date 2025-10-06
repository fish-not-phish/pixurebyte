"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth";
import { toast } from "sonner";
import { fetchTeams } from "@/services/teams"; 

interface LoginFormProps extends React.ComponentProps<"form"> {
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export function LoginForm({ loading, setLoading, className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login({ email, password });

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      const teams = await fetchTeams();

      if (teams.length > 0) {
        const teamId = teams[teams.length - 1].id;
        toast.success("Login successful", {
          description: "Redirecting to your dashboard...",
        });
        setTimeout(() => (window.location.href = `/team/${teamId}`), 1200);
      } else {
        toast.error("No team found", {
          description: "Please contact support.",
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";

      toast.error("Login failed", { description: message });
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/sign-up" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  );
}
