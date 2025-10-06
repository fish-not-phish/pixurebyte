"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { initiateScan } from "@/services/scan";
import type { Scan } from "@/types/scan";
import { use } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ScanPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const result = await initiateScan(teamId, values);
      setScan(result);
      router.push(`/team/${teamId}/scan/${result.scan_id}/loading`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate scan";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto mt-10 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Initiate Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Input
              placeholder="Enter URL (e.g. https://example.com)"
              {...form.register("url")}
              className="w-full h-12 text-lg px-4"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 text-base cursor-pointer"
            >
              {loading ? "Starting..." : "Start Scan"}
            </Button>
          </form>

          {form.formState.errors.url && (
            <p className="text-sm text-red-500 mt-2">
              {form.formState.errors.url.message}
            </p>
          )}

          {scan && (
            <div className="mt-6 p-4 border rounded bg-muted">
              <p>
                <strong>Scan ID:</strong> {scan.scan_id}
              </p>
              <p>
                <strong>Status:</strong> {scan.status}
              </p>
              <p>
                <strong>URL:</strong> {scan.url}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
