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

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function passwordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 12) errors.push("At least 12 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/\d/.test(password)) errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(password))
    errors.push("One special character");

  return errors;
}

export function RegisterForm({
  className,
  loading,
  setLoading,
  ...props
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const pwdErrors = passwordErrors(password);
  const passwordValid = STRONG_PASSWORD_REGEX.test(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Password does not meet security requirements.");
      return;
    }

    setLoading(true);

    try {
      await register({ email, password });

      const tokens = await login({ email, password });
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);

      const teams = await fetchTeams();

      if (teams.length > 0) {
        const teamId = teams[teams.length - 1].id;
        toast.success("Account created");
        setTimeout(() => (window.location.href = `/team/${teamId}`), 1200);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      toast.error("Registration failed", { description: message });
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
            aria-invalid={!passwordValid && password.length > 0}
          />

          {/* Password rules */}
          <ul className="text-xs space-y-1">
            {pwdErrors.map((err) => (
              <li key={err} className="text-red-500">
                • {err}
              </li>
            ))}
            {password.length > 0 && passwordValid && (
              <li className="text-green-600">✓ Strong password</li>
            )}
          </ul>
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading || !passwordValid}
        >
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
