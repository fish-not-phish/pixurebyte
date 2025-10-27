"use client";

import { Badge } from "@/components/ui/badge";

function epochToLocalString(epochSeconds?: number): string {
  if (!epochSeconds && epochSeconds !== 0) return "—";
  const d = new Date(epochSeconds * 1000);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function isExpired(validTo?: number): boolean {
  if (!validTo && validTo !== 0) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return validTo < nowSec;
}

function expiresSoon(validTo?: number, days = 30): boolean {
  if (!validTo && validTo !== 0) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return validTo >= nowSec && validTo <= nowSec + days * 24 * 60 * 60;
}

type DN = Record<string, string> | undefined | null;

function prettyLabel(k: string) {
  const map: Record<string, string> = {
    commonName: "Common Name (CN)",
    CN: "Common Name (CN)",
    organizationName: "Organization (O)",
    O: "Organization (O)",
    organizationalUnitName: "Org Unit (OU)",
    OU: "Org Unit (OU)",
    countryName: "Country (C)",
    C: "Country (C)",
    stateOrProvinceName: "State/Province (ST)",
    ST: "State/Province (ST)",
    localityName: "Locality (L)",
    L: "Locality (L)",
    emailAddress: "Email",
  };
  return map[k] ?? k;
}

function getCN(dn: DN) {
  if (!dn) return undefined;
  return dn.commonName ?? dn.CN;
}

export interface SSLInfo {
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  san?: string[];
  valid_from?: string;
  valid_to?: string;
  server_ip?: string;
  server_port?: number;
  error?: string;
}

export function CertificateDetails({ sslInfo }: { sslInfo?: SSLInfo | null }) {
  if (!sslInfo) return null;

  if ("error" in sslInfo && sslInfo.error) {
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-lg">Certificate Details</p>
          <Badge variant="destructive">Unavailable</Badge>
        </div>
        <p className="text-sm text-muted-foreground break-words">
          {sslInfo.error}
        </p>
      </div>
    );
  }

  const validFromEpoch = sslInfo.valid_from
    ? Date.parse(sslInfo.valid_from) / 1000
    : undefined;
  const validToEpoch = sslInfo.valid_to
    ? Date.parse(sslInfo.valid_to) / 1000
    : undefined;

  const statusBadge = isExpired(validToEpoch) ? (
    <Badge variant="destructive">Expired</Badge>
  ) : expiresSoon(validToEpoch, 30) ? (
    <Badge variant="secondary">Expires Soon</Badge>
  ) : (
    <Badge variant="outline">Valid</Badge>
  );

  const subjectCN = getCN(sslInfo.subject);
  const issuerCN = getCN(sslInfo.issuer);

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-lg">Certificate Details</p>
          {statusBadge}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-1">Subject</p>
          {subjectCN && (
            <p className="text-sm mb-2">
              <span className="text-muted-foreground">CN:&nbsp;</span>
              <span className="font-medium">{subjectCN}</span>
            </p>
          )}
          {sslInfo.subject ? (
            <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-1">
              {Object.entries(sslInfo.subject).map(([k, v]) => (
                <li key={`sub-${k}`} className="truncate">
                  <span className="text-muted-foreground">
                    {prettyLabel(k)}:
                  </span>{" "}
                  <span className="font-medium">{v}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>

        <div className="border rounded-lg p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-1">Issuer</p>
          {issuerCN && (
            <p className="text-sm mb-2">
              <span className="text-muted-foreground">CN:&nbsp;</span>
              <span className="font-medium">{issuerCN}</span>
            </p>
          )}
          {sslInfo.issuer ? (
            <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-1">
              {Object.entries(sslInfo.issuer).map(([k, v]) => (
                <li key={`iss-${k}`} className="truncate">
                  <span className="text-muted-foreground">
                    {prettyLabel(k)}:
                  </span>{" "}
                  <span className="font-medium">{v}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-1">
          Subject Alternative Names
        </p>
        {sslInfo.san?.length ? (
          <div className="flex flex-wrap gap-2">
            {sslInfo.san.map((name, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm">—</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div>
          <p className="text-sm text-muted-foreground">Protocol</p>
          <p className="font-medium">TLS</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valid From</p>
          <p className="font-medium">
            {epochToLocalString(validFromEpoch)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valid To</p>
          <p className="font-medium">
            {epochToLocalString(validToEpoch)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Server IP</p>
          <p className="font-medium">{sslInfo.server_ip ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Server Port</p>
          <p className="font-medium">{sslInfo.server_port ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
