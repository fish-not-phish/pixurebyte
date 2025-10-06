"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchScan } from "@/services/scan";
import type { Scan } from "@/types/scan";
import type {
  RenderProps,
} from "prism-react-renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import { ScanResponse, ScanDownload, ScanRequest } from "@/types/analytics";
import Image from "next/image";

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
          const message =
            err instanceof Error ? err.message : "Failed to load HTML";
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

  if (!scan) {
    return <p className="text-center mt-10">Loading results...</p>;
  }

  const handleCopy = async () => {
    if (!htmlSource) return;
    try {
      await navigator.clipboard.writeText(htmlSource);
      setCopyOK("done");
      setTimeout(() => setCopyOK("idle"), 1200);
    } catch {
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-10 max-w-screen-xl mx-auto overflow-x-hidden">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Scan Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-6 w-full mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-2">
              <p><strong>URL:</strong> {scan.url}</p>
              <p><strong>Status:</strong> <Badge>{scan.status}</Badge></p>
              {scan.title && <p><strong>Title:</strong> {scan.title}</p>}
              {scan.h1 && <p><strong>H1:</strong> {scan.h1}</p>}
              <p>
                <strong>Created:</strong>{" "}
                {scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {scan.last_updated ? new Date(scan.last_updated).toLocaleString() : "—"}
              </p>
            </TabsContent>

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
                      const href =
                        mediaOrigin && d?.zip_key
                          ? `${mediaOrigin}/${d.zip_key}`
                          : d?.zip_key || "#";
                      return (
                        <TableRow key={i}>
                          <TableCell>{d.filename}</TableCell>
                          <TableCell className="font-mono text-xs">{d.sha256}</TableCell>
                          <TableCell>
                            {d?.zip_key ? (
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

            <TabsContent value="requests">
              {scan.requests?.length ? (
                <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Method</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scan.requests?.map((r: ScanRequest, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{r.method}</TableCell>
                          <TableCell className="truncate break-all">{r.url}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p>No requests captured</p>
              )}
            </TabsContent>

            <TabsContent value="responses">
              {scan.responses?.length ? (
                <ScrollArea className="h-[75vh] border rounded overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-24">OK</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scan.responses?.map((r: ScanResponse, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{r.status}</TableCell>
                          <TableCell>{r.ok ? "✅" : "❌"}</TableCell>
                          <TableCell className="truncate break-all">{r.url}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p>No responses captured</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
