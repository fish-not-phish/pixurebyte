"use client";

import { useEffect, useState } from "react";
import { fetchScans } from "@/services/scan";
import type { ScanList } from "@/types/scan";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { use } from "react"

export default function ScanSearchPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const [scans, setScans] = useState<ScanList[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined);

  const pageSize = 10;

  useEffect(() => {
    fetchScans(teamId, page, pageSize).then((data) => {
      setScans(data.items);
      setCount(data.count);
    });
  }, [teamId, page]);

  const filtered = scans.filter((scan) => {
    const matchText =
      scan.url.toLowerCase().includes(filter.toLowerCase()) ||
      (scan.title ?? "").toLowerCase().includes(filter.toLowerCase());

    const matchUser =
      !userFilter ||
      userFilter === "__all__" ||
      (scan.requested_by && scan.requested_by === userFilter);

    let matchDate = true;
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      matchDate = new Date(scan.created_at) >= fromDate;
    }
    if (matchDate && dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchDate = new Date(scan.created_at) <= toDate;
    }

    return matchText && matchUser && matchDate;
  });

  const totalPages = Math.ceil(count / pageSize);

  const users = Array.from(
    new Set(scans.map((s) => s.requested_by).filter((u): u is string => Boolean(u)))
  );

  return (
    <div className="w-full px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Team Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <Input
              placeholder="Filter by URL or Title..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />

            <Select
              value={userFilter ?? "__all__"}
              onValueChange={(val) => setUserFilter(val === "__all__" ? undefined : val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {dateRange?.from && dateRange?.to
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : "Filter by Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <ScrollArea className="h-[70vh] rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length ? (
                  filtered.map((scan) => (
                    <TableRow key={scan.scan_id}>
                      <TableCell>
                        <a
                          href={`/team/${teamId}/scan/${scan.scan_id}/results`}
                          className="text-blue-500 underline"
                        >
                          {scan.url}
                        </a>
                      </TableCell>
                      <TableCell>{scan.title ?? "—"}</TableCell>
                      <TableCell><Badge>{scan.status}</Badge></TableCell>
                      <TableCell>{scan.requested_by ?? "—"}</TableCell>
                      <TableCell>{new Date(scan.created_at).toLocaleString()}</TableCell>
                      <TableCell>{new Date(scan.last_updated).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No scans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>Page {page} of {totalPages || 1}</span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
