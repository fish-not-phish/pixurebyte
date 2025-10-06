"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, login } from "@/services/auth";
import { toast } from "sonner";
import { fetchTeams } from "@/services/teams"; 

type RegisterFormProps = React.ComponentProps<"form"> & {
  loading: boolean;
  setLoading: (val: boolean) => void;
};

export function RegisterForm({ className, loading, setLoading, ...props }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register({ email, password });

      const tokens = await login({ email, password });
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);

      const teams = await fetchTeams();

      if (teams.length > 0) {
        const teamId = teams[teams.length - 1].id;
        toast.success("Account created", {
          description: "Welcome! Redirecting to your dashboard...",
        });
        setTimeout(() => (window.location.href = `/team/${teamId}`), 1200);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      toast.error("Registration failed", {
        description: message,
      });
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
        <h1 className="text-2xl font-bold">Create an account</h1>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          {loading ? "Signing up..." : "Sign up"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/login" className="underline underline-offset-4">
          Log in
        </a>
      </div>
    </form>
  );
}
