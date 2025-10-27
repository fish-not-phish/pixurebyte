"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchScan } from "@/services/scan";
import type { Scan } from "@/types/scan";
import type { RenderProps } from "prism-react-renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import { ScanResponse, ScanDownload, ScanRequest } from "@/types/scan";
import Image from "next/image";
import { CertificateDetails } from "@/components/cert-card";

export default function ScanResultsPage() {
  const { teamId, scanId } = useParams<{ teamId: string; scanId: string }>();
  const [scan, setScan] = useState<Scan | null>(null);

  const [htmlSource, setHtmlSource] = useState<string | null>(null);
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [copyOK, setCopyOK] = useState<"idle" | "done">("idle");

  useEffect(() => {
    fetchScan(teamId, scanId).then(setScan);
  }, [teamId, scanId]);

  useEffect(() => {
    const url = scan?.full_code;
    if (!url) {
      setHtmlSource(null);
      setHtmlError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!cancelled) {
          setHtmlSource(text);
          setHtmlError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load HTML";
          setHtmlSource(null);
          setHtmlError(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scan?.full_code]);

  const mediaOrigin = useMemo(() => {
    const candidate = scan?.screenshot || scan?.full_code;
    try {
      return candidate ? new URL(candidate).origin : "";
    } catch {
      return "";
    }
  }, [scan?.screenshot, scan?.full_code]);

  const certInfo = useMemo(() => {
    if (!scan?.ssl_info) return null;
    const info = scan.ssl_info;
    const validFrom = info.valid_from ? Date.parse(info.valid_from) / 1000 : undefined;
    const validTo = info.valid_to ? Date.parse(info.valid_to) / 1000 : undefined;
    return {
      issuer: info.issuer ? JSON.stringify(info.issuer) : "—",
      subject: info.subject ? JSON.stringify(info.subject) : "—",
      protocol: "TLS",
      valid_from: validFrom,
      valid_to: validTo,
      server_ip: undefined,
      server_port: 443,
    };
  }, [scan?.ssl_info]);

  if (!scan) {
    return <p className="text-center mt-10">Loading results...</p>;
  }

  const handleCopy = async () => {
    if (!htmlSource) return;
    try {
      await navigator.clipboard.writeText(htmlSource);
      setCopyOK("done");
      setTimeout(() => setCopyOK("idle"), 1200);
    } catch {}
  };

  return (
    <div className="w-full px-4 sm:px-6 py-10 max-w-screen-xl mx-auto overflow-x-hidden">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Scan Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-8 w-full mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-2">
                <p><strong>URL:</strong> {scan.url}</p>
                <p><strong>Status:</strong> <Badge>{scan.status}</Badge></p>
                {scan.title && <p><strong>Title:</strong> {scan.title}</p>}
                {scan.h1 && <p><strong>H1:</strong> {scan.h1}</p>}
                <p><strong>Created:</strong> {scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}</p>
                <p><strong>Last Updated:</strong> {scan.last_updated ? new Date(scan.last_updated).toLocaleString() : "—"}</p>
              </div>

              {scan.ssl_info && <CertificateDetails sslInfo={scan.ssl_info} />}
            </TabsContent>

            {/* SCREENSHOT */}
            <TabsContent value="screenshot">
              {scan.screenshot ? (
                <div className="relative w-full h-[80vh] border rounded overflow-hidden">
                  <Image
                    src={scan.screenshot}
                    alt="Scan screenshot"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 100vw"
                    priority
                    unoptimized
                  />
                </div>
              ) : (
                <p>No screenshot available</p>
              )}
            </TabsContent>

            {/* HTML */}
            <TabsContent value="html">
              {scan.full_code ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {htmlSource
                        ? "Showing raw HTML snapshot (syntax highlighted)"
                        : htmlError
                        ? "Could not fetch raw HTML — showing rendered snapshot instead"
                        : "Loading HTML..."}
                    </div>
                    <div className="flex gap-2">
                      {htmlSource && (
                        <>
                          <Button size="sm" variant="secondary" onClick={handleCopy}>
                            {copyOK === "done" ? "Copied!" : "Copy"}
                          </Button>
                          <a
                            href={scan.full_code}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">Open raw</Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {htmlSource ? (
                    <div className="border rounded">
                      <ScrollArea className="h-[85vh] overflow-x-auto">
                        <Highlight
                          theme={themes.shadesOfPurple}
                          code={htmlSource}
                          language="markup"
                        >
                          {({
                            className,
                            style,
                            tokens,
                            getLineProps,
                            getTokenProps,
                          }: RenderProps) => {
                            const mergedStyle: React.CSSProperties = {
                              ...style,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            };
                            return (
                              <pre
                                className={`${className} text-sm leading-relaxed p-4 min-h-[85vh] max-w-full`}
                                style={mergedStyle}
                              >
                                {tokens.map((line, i) => {
                                  const lineProps = getLineProps({ line, key: i });
                                  return (
                                    <div key={i} {...lineProps} className="flex gap-4 min-w-0">
                                      <span className="select-none text-muted-foreground w-10 flex-shrink-0 text-right pr-2">
                                        {i + 1}
                                      </span>
                                      <span className="min-w-0 break-words whitespace-pre-wrap">
                                        {line.map((token, key) => {
                                          const tokenProps = getTokenProps({ token, key });
                                          return <span key={key} {...tokenProps} />;
                                        })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </pre>
                            );
                          }}
                        </Highlight>
                      </ScrollArea>
                    </div>
                  ) : (
                    <ScrollArea className="h-[85vh] border rounded overflow-x-auto">
                      <iframe
                        src={scan.full_code}
                        className="w-full h-full rounded"
                        sandbox=""
                      />
                    </ScrollArea>
                  )}
                </>
              ) : (
                <p>No HTML snapshot available</p>
              )}
            </TabsContent>


            {/* DOWNLOADS */}
            <TabsContent value="downloads">
              {scan.downloads?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>SHA256</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scan.downloads?.map((d: ScanDownload, i: number) => {
                      const href = d.s3_key ? `${mediaOrigin}/${d.s3_key}` : "#";
                      return (
                        <TableRow key={i}>
                          <TableCell>{d.filename}</TableCell>
                          <TableCell className="font-mono text-xs">{d.sha256}</TableCell>
                          <TableCell>
                            {d.s3_key ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 underline"
                              >
                                Download
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p>No downloads recorded</p>
              )}
            </TabsContent>

            {/* REQUESTS */}
            <TabsContent value="requests">
              {scan.requests?.length ? (
                <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] text-center">Method</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scan.requests.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center font-mono text-xs w-[100px]">
                            {r.method}
                          </TableCell>
                          <TableCell className="break-words whitespace-normal text-sm">
                            {r.url}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p>No requests captured</p>
              )}
            </TabsContent>


            {/* RESPONSES */}
            <TabsContent value="responses">
              {scan.responses?.length ? (
                <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-center">Status</TableHead>
                        <TableHead className="w-[60px] text-center">OK</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scan.responses.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center font-mono text-xs w-[80px]">
                            {r.status}
                          </TableCell>
                          <TableCell className="text-center w-[60px]">
                            {r.ok ? "✅" : "❌"}
                          </TableCell>
                          <TableCell className="break-words whitespace-normal text-sm">
                            {r.url}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p>No responses captured</p>
              )}
            </TabsContent>


            {/* LINKS */}
            <TabsContent value="links">
              {scan.links?.length ? (
                <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-center">#</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scan.links.map((link, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center font-mono text-xs w-[60px]">{i + 1}</TableCell>
                          <TableCell className="break-words whitespace-normal">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline break-all"
                            >
                              {link.length > 120 ? `${link.slice(0, 120)}…` : link}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p>No links discovered</p>
              )}
            </TabsContent>

            {/* SCRIPTS */}
            <TabsContent value="scripts">
              {scan.scripts?.length ? (() => {
                const scored = scan.scripts.map((src) => {
                  const lower = src.toLowerCase();
                  let score = 5;

                  if (/:\\d{2,5}/.test(lower)) score = 1;
                  else if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(lower)) score = 2;
                  else if (lower.startsWith("http://")) score = 3;
                  else if (/\basync\b/.test(lower)) score = 4;

                  return { src, score };
                });

                const sorted = scored.sort((a, b) => a.score - b.score);

                const label = (score: number) => {
                  switch (score) {
                    case 1:
                      return <Badge variant="destructive">Port Usage</Badge>;
                    case 2:
                      return <Badge variant="destructive">IP Address</Badge>;
                    case 3:
                      return <Badge variant="destructive">HTTP (Insecure)</Badge>;
                    case 4:
                      return <Badge variant="secondary">Async Load</Badge>;
                    default:
                      return <Badge variant="outline">Normal</Badge>;
                  }
                };

                const suspiciousCount = scored.filter(s => s.score < 5).length;

                return (
                  <div>
                    {suspiciousCount > 0 ? (
                      <p className="mb-3 text-sm font-medium text-destructive">
                        ⚠️ {suspiciousCount} potentially suspicious script{(suspiciousCount > 1 ? "s" : "")} detected
                      </p>
                    ) : (
                      <p className="mb-3 text-sm text-muted-foreground">
                        ✅ No suspicious scripts detected
                      </p>
                    )}

                    <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] text-center">#</TableHead>
                            <TableHead className="w-[160px] text-center">Indicator</TableHead>
                            <TableHead>Script Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sorted.map(({ src, score }, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-center">{i + 1}</TableCell>
                              <TableCell className="text-center">{label(score)}</TableCell>
                              <TableCell className="break-words whitespace-normal font-mono text-xs">
                                {src.startsWith("http") || src.startsWith("/")
                                  ? (
                                    <a
                                      href={src}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 underline"
                                    >
                                      {src}
                                    </a>
                                  )
                                  : (
                                    <span className="text-muted-foreground">{src}</span>
                                  )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                );
              })() : (
                <p>No scripts discovered</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
