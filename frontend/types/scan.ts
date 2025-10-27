export interface ScanDownload {
  filename: string;
  sha256: string;
  s3_key: string;
}

export interface ScanSSLInfo {
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  san?: string[];
  valid_from?: string;
  valid_to?: string;
}

export interface ScanRequest {
  method: string;
  url: string;
}

export interface ScanResponse {
  status: number;
  ok: boolean;
  url: string;
  issuer?: string;
  subject?: string;
  protocol?: string;
  valid_from?: number;
  valid_to?: number;
  server_ip?: string;
  server_port?: number;
}

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
  downloads?: ScanDownload[];
  requests?: ScanRequest[];
  responses?: ScanResponse[];
  links?: string[];
  scripts?: string[];
  ssl_info?: ScanSSLInfo;
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