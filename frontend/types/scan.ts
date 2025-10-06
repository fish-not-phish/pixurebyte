export interface Scan {
  scan_id: string;
  team_id: string;
  url: string;
  status: string;
  screenshot?: string | null;
  full_code?: string | null;
  title?: string | null;
  h1?: string | null;
  created_at?: string;
  last_updated?: string;
  downloads?: { filename: string; sha256: string; s3_key: string }[];
  requests?: { method: string; url: string }[];
  responses?: { status: number; ok: boolean; url: string }[];
}


export interface ScanCreateIn {
  url: string;
}

export type ScanCreateOut = Scan;

export type ScanList = {
  scan_id: string;
  url: string;
  title?: string | null;
  h1?: string | null;
  status: string;
  created_at: string;
  last_updated: string;
  requested_by?: string | null;
};

