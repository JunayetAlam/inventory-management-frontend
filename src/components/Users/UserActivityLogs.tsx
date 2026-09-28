"use client";

import { useState } from "react";
import { useGetAllActivityLogsQuery } from "@/redux/api/activityLogApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
} from "lucide-react";
import { TActivityLog } from "@/types";

const getActionBadge = (action: string) => {
  if (
    action.includes("CREATE") ||
    action.includes("REGISTER") ||
    action.includes("ADD") ||
    action.includes("APPROVE")
  ) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
        {action}
      </Badge>
    );
  }
  if (
    action.includes("DELETE") ||
    action.includes("REVOKE") ||
    action.includes("BLOCK") ||
    action.includes("REJECT")
  ) {
    return (
      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
        {action}
      </Badge>
    );
  }
  if (action.includes("RESTORE") || action.includes("REACTIVATE")) {
    return (
      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">
        {action}
      </Badge>
    );
  }
  if (action.includes("UPDATE") || action.includes("STATUS") || action.includes("ROLE")) {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
        {action}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {action}
    </Badge>
  );
};

export default function UserActivityLogs({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const [detailModalLog, setDetailModalLog] = useState<TActivityLog | null>(null);

  const { data, isLoading } = useGetAllActivityLogsQuery({
    userId,
    page,
    limit: 10,
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="rounded-lg border border-border bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Activity History</h2>
          <p className="text-sm text-muted-foreground">
            Recent audit logs and actions performed by or on this account.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} index={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-14 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  <Activity className="size-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-sm">No activity records found for this user.</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <TableRow key={log.id} index={index}>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground text-xs">{log.entityType}</span>
                    {log.entityId && (
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {log.entityId.slice(0, 8)}...
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Globe className="size-3" />
                      {log.ipAddress || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground/70" />
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailModalLog(log)}
                        className="h-7 text-xs px-2"
                      >
                        <Eye className="mr-1 size-3.5" />
                        View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPage} ({meta.total} logs)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPage}
              className="h-7 px-2 text-xs"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog
        open={Boolean(detailModalLog)}
        onOpenChange={(open) => !open && setDetailModalLog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Activity Details
            </DialogTitle>
          </DialogHeader>
          {detailModalLog && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p>
                  <strong className="text-foreground">Action:</strong> {detailModalLog.action}
                </p>
                <p>
                  <strong className="text-foreground">Entity:</strong> {detailModalLog.entityType} ({detailModalLog.entityId || "N/A"})
                </p>
                <p>
                  <strong className="text-foreground">Time:</strong> {new Date(detailModalLog.createdAt).toLocaleString()}
                </p>
              </div>
              <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-52">
                {JSON.stringify(detailModalLog.details, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
