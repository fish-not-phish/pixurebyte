"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchScan } from "@/services/scan";
import type { Scan } from "@/types/scan";

export default function ScanLoadingPage() {
  const { teamId, scanId } = useParams<{ teamId: string; scanId: string }>();
  const router = useRouter();

  useEffect(() => {
    async function poll() {
      try {
        const scan: Scan = await fetchScan(teamId, scanId);
        if (scan.status === "complete") {
          router.push(`/team/${teamId}/scan/${scanId}/results`);
        } else if (scan.status === "failed") {
          router.push(`/team/${teamId}/scan/${scanId}/failed`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    const interval = setInterval(poll, 5000);
    poll();

    return () => clearInterval(interval);
  }, [teamId, scanId, router]);

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Your scan is processing...</h1>
        <p className="text-muted-foreground mt-2">
          This may take a minute. We’ll redirect you when it’s ready.
        </p>
      </div>
    </div>
  );
}
