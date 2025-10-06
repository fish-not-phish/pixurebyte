import { apiFetch } from "@/lib/api";
import type { Scan, ScanCreateIn, ScanCreateOut, ScanList } from "@/types/scan";

export async function initiateScan(
  teamId: string,
  payload: ScanCreateIn
): Promise<ScanCreateOut> {
  return apiFetch<ScanCreateOut>(`/scans/teams/${teamId}/scans/initiate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchScan(teamId: string, scanId: string): Promise<Scan> {
  return apiFetch<Scan>(`/scans/teams/${teamId}/scans/${scanId}`, {
    method: "GET",
  });
}

export async function fetchScans(
  teamId: string,
  page = 1,
  pageSize = 10
): Promise<{ items: ScanList[]; count: number }> {
  return apiFetch<{ items: ScanList[]; count: number }>(
    `/scans/teams/${teamId}/scans?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
    }
  );
}

