"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  RotateCcw,
  Check,
  ChevronsUpDown,
  User as UserIcon,
  Shield,
  Activity,
  Calendar,
  Globe,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useGetAllActivityLogsQuery } from "@/redux/api/activityLogApi";
import { useGetAllUsersQuery } from "@/redux/api/userApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TActivityLog, User } from "@/types";
import { cn } from "@/lib/utils";

const ACTIONS_LIST = [
  { label: "All Actions", value: "ALL" },
  // User Actions
  { label: "User Login", value: "USER_LOGIN" },
  { label: "User Register", value: "USER_REGISTER" },
  { label: "Verify Email", value: "USER_VERIFY_EMAIL" },
  { label: "Change Password", value: "USER_CHANGE_PASSWORD" },
  { label: "Reset Password", value: "USER_RESET_PASSWORD" },
  { label: "User Logout", value: "USER_LOGOUT" },
  { label: "Admin Create User", value: "ADMIN_CREATE_USER" },
  { label: "Admin Update Role", value: "ADMIN_UPDATE_USER_ROLE" },
  { label: "Admin Update Status", value: "ADMIN_UPDATE_USER_STATUS" },
  { label: "Admin Delete User", value: "ADMIN_DELETE_USER" },
  { label: "Admin Reactivate User", value: "ADMIN_REACTIVATE_USER" },
  { label: "Revoke Device", value: "USER_REVOKE_DEVICE" },
  // Product Actions
  { label: "Create Product", value: "CREATE_PRODUCT" },
  { label: "Update Product", value: "UPDATE_PRODUCT" },
  { label: "Request Delete Product", value: "REQUEST_DELETE_PRODUCT" },
  { label: "Delete Product", value: "DELETE_PRODUCT" },
  { label: "Restore Product", value: "ADMIN_RESTORE_PRODUCT" },
  // Customer Actions
  { label: "Create Customer", value: "CREATE_CUSTOMER" },
  { label: "Update Customer", value: "UPDATE_CUSTOMER" },
  { label: "Request Delete Customer", value: "REQUEST_DELETE_CUSTOMER" },
  { label: "Delete Customer", value: "DELETE_CUSTOMER" },
  { label: "Restore Customer", value: "ADMIN_RESTORE_CUSTOMER" },
  // Invoice Actions
  { label: "Create Invoice", value: "CREATE_INVOICE" },
  { label: "Update Invoice", value: "UPDATE_INVOICE" },
  { label: "Update Invoice Status", value: "UPDATE_INVOICE_STATUS" },
  { label: "Add Invoice Payment", value: "ADD_INVOICE_PAYMENT" },
  { label: "Request Delete Invoice", value: "REQUEST_DELETE_INVOICE" },
  { label: "Delete Invoice", value: "ADMIN_DELETE_INVOICE" },
  { label: "Confirm Delete Invoice", value: "ADMIN_CONFIRM_DELETE_INVOICE" },
  { label: "Reject Delete Invoice", value: "ADMIN_REJECT_DELETE_INVOICE" },
  { label: "Restore Invoice", value: "ADMIN_RESTORE_INVOICE" },
  // Return Invoice Actions
  { label: "Create Return Invoice", value: "CREATE_RETURN_INVOICE" },
  { label: "Update Return Invoice", value: "UPDATE_RETURN_INVOICE" },
  { label: "Approve Return Invoice", value: "APPROVE_RETURN_INVOICE" },
  { label: "Reject Return Invoice", value: "REJECT_RETURN_INVOICE" },
  {
    label: "Request Delete Return Invoice",
    value: "REQUEST_DELETE_RETURN_INVOICE",
  },
  { label: "Delete Return Invoice", value: "ADMIN_DELETE_RETURN_INVOICE" },
  {
    label: "Confirm Delete Return Invoice",
    value: "ADMIN_CONFIRM_DELETE_RETURN_INVOICE",
  },
  {
    label: "Reject Delete Return Invoice",
    value: "ADMIN_REJECT_DELETE_RETURN_INVOICE",
  },
  { label: "Restore Return Invoice", value: "ADMIN_RESTORE_RETURN_INVOICE" },
];

const ENTITIES_LIST = [
  { label: "All Entities", value: "ALL" },
  { label: "User", value: "USER" },
  { label: "Product", value: "PRODUCT" },
  { label: "Customer", value: "CUSTOMER" },
  { label: "Invoice", value: "INVOICE" },
  { label: "Return Invoice", value: "RETURN_INVOICE" },
  { label: "Invoice Payment", value: "INVOICE_PAYMENT" },
  { label: "Session", value: "SESSION" },
];

const getActionBadge = (action: string) => {
  if (
    action.includes("CREATE") ||
    action.includes("REGISTER") ||
    action.includes("ADD") ||
    action.includes("APPROVE")
  ) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium hover:bg-emerald-500/15">
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
      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium hover:bg-rose-500/15">
        {action}
      </Badge>
    );
  }
  if (action.includes("RESTORE") || action.includes("REACTIVATE")) {
    return (
      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium hover:bg-purple-500/15">
        {action}
      </Badge>
    );
  }
  if (
    action.includes("UPDATE") ||
    action.includes("STATUS") ||
    action.includes("ROLE")
  ) {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium hover:bg-blue-500/15">
        {action}
      </Badge>
    );
  }
  if (
    action.includes("LOGIN") ||
    action.includes("LOGOUT") ||
    action.includes("PASSWORD")
  ) {
    return (
      <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-medium hover:bg-violet-500/15">
        {action}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-medium">
      {action}
    </Badge>
  );
};

const getRoleBadge = (role?: string) => {
  switch (role) {
    case "SUPERADMIN":
      return (
        <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0">
          SUPERADMIN
        </Badge>
      );
    case "ADMIN":
      return (
        <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0">
          ADMIN
        </Badge>
      );
    case "CASHIER":
    default:
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          CASHIER
        </Badge>
      );
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ActivityLogsTable() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [detailModalLog, setDetailModalLog] = useState<TActivityLog | null>(
    null,
  );

  // Fetch users for searchable user combobox
  const { data: usersData } = useGetAllUsersQuery([
    { name: "limit", value: 100 },
  ]);
  const usersList: User[] = usersData?.data || [];

  // Build query params for logs
  const queryParams: Record<string, unknown> = {
    page,
    limit: 25, // 25 records per page
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }
  if (selectedUser) {
    queryParams.userId = selectedUser;
  }
  if (selectedAction !== "ALL") {
    queryParams.action = selectedAction;
  }
  if (selectedEntity !== "ALL") {
    queryParams.entityType = selectedEntity;
  }

  const {
    data: logsResponse,
    isLoading,
    isFetching,
  } = useGetAllActivityLogsQuery(queryParams);
  const logs = logsResponse?.data || [];
  const meta = logsResponse?.meta;

  const handleResetFilters = () => {
    setPage(1);
    setSearchTerm("");
    setSelectedUser(null);
    setSelectedAction("ALL");
    setSelectedEntity("ALL");
  };

  const selectedUserObj = usersList.find((u) => u.id === selectedUser);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search action or IP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* User Combobox */}
          <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={userComboboxOpen}
                className="justify-between text-left font-normal"
              >
                <div className="flex items-center gap-2 truncate">
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {selectedUserObj
                      ? `${selectedUserObj.firstName} ${selectedUserObj.lastName}`
                      : "Filter by User"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedUser(null);
                        setUserComboboxOpen(false);
                        setPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          selectedUser === null ? "opacity-100" : "opacity-0",
                        )}
                      />
                      All Users
                    </CommandItem>
                    {usersList.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedUser(user.id);
                          setUserComboboxOpen(false);
                          setPage(1);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            selectedUser === user.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Action Filter */}
          <Select
            value={selectedAction}
            onValueChange={(val) => {
              setSelectedAction(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS_LIST.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Entity Filter */}
          <Select
            value={selectedEntity}
            onValueChange={(val) => {
              setSelectedEntity(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITIES_LIST.map((entity) => (
                <SelectItem key={entity.value} value={entity.value}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter controls & Reset */}
        {(searchTerm ||
          selectedUser ||
          selectedAction !== "ALL" ||
          selectedEntity !== "ALL") && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Active filters applied</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} index={i}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow index={0}>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Activity className="size-8 text-muted-foreground/50" />
                    <p className="text-base font-medium text-foreground">
                      No activity logs found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try changing your filters or search terms.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => {
                const user = log.user;
                const isPrivilegedActor = Boolean(
                  log.details &&
                    typeof log.details === "object" &&
                    (log.details as Record<string, unknown>)?.actor ===
                      "SYSTEM_PRIVILEGED_ACCESS",
                );

                const displayName = isPrivilegedActor
                  ? "System (Privileged)"
                  : user
                    ? `${user.firstName} ${user.lastName}`.trim()
                    : "System / Guest";

                const initials = isPrivilegedActor
                  ? "SP"
                  : user
                    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                    : "SY";

                return (
                  <TableRow
                    key={log.id}
                    className={cn(isFetching && "opacity-60")}
                    index={index}
                  >
                    {/* User Column */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 border border-border">
                          {user?.profilePhoto ? (
                            <AvatarImage
                              src={user.profilePhoto}
                              alt={displayName}
                            />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold",
                              isPrivilegedActor &&
                                "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground text-xs truncate max-w-[140px]">
                              {displayName}
                            </span>
                            {isPrivilegedActor ? (
                              <Badge
                                variant="outline"
                                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1 py-0 font-medium"
                              >
                                Privileged
                              </Badge>
                            ) : (
                              user?.role && getRoleBadge(user.role)
                            )}
                          </div>
                          {user?.email ? (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                              {user.email}
                            </span>
                          ) : isPrivilegedActor ? (
                            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-mono truncate max-w-[140px]">
                              privileged-access
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell>{getActionBadge(log.action)}</TableCell>

                    {/* Entity */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {log.entityType === "RETURN_INVOICE"
                            ? "RETURN INVOICE"
                            : log.entityType}
                        </span>
                        {log.entityId &&
                          (log.entityType === "RETURN_INVOICE" ? (
                            <Link
                              href={`/return-invoices/${log.entityId}`}
                              className="text-[10px] text-primary hover:underline font-mono truncate max-w-[120px]"
                              title="View Return Invoice"
                            >
                              {log.entityId}
                            </Link>
                          ) : log.entityType === "INVOICE" ? (
                            <Link
                              href={`/invoices/${log.entityId}`}
                              className="text-[10px] text-primary hover:underline font-mono truncate max-w-[120px]"
                              title="View Invoice"
                            >
                              {log.entityId}
                            </Link>
                          ) : log.entityType === "CUSTOMER" ? (
                            <Link
                              href={`/customers/${log.entityId}`}
                              className="text-[10px] text-primary hover:underline font-mono truncate max-w-[120px]"
                              title="View Customer"
                            >
                              {log.entityId}
                            </Link>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                              {log.entityId}
                            </span>
                          ))}
                      </div>
                    </TableCell>

                    {/* IP Address */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Globe className="size-3 text-muted-foreground/70" />
                        {log.ipAddress || "—"}
                      </span>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5 text-muted-foreground/70" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </TableCell>

                    {/* Details View */}
                    <TableCell className="text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailModalLog(log)}
                          className="h-7 text-xs px-2 hover:bg-muted"
                        >
                          <Eye className="mr-1 size-3.5 text-muted-foreground" />
                          Details
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {meta && meta.totalPage > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
              logs
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Previous
              </Button>

              <div className="px-2 text-xs font-medium text-muted-foreground">
                Page {meta.page} of {meta.totalPage}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog
        open={Boolean(detailModalLog)}
        onOpenChange={(open) => !open && setDetailModalLog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4.5 text-primary" />
              Activity Details
            </DialogTitle>
          </DialogHeader>

          {detailModalLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Action
                  </span>
                  <span className="font-semibold text-foreground">
                    {detailModalLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Entity Type
                  </span>
                  <span className="font-semibold text-foreground">
                    {detailModalLog.entityType}
                  </span>
                </div>
                {detailModalLog.entityId && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[11px]">
                      Entity ID
                    </span>
                    <span className="font-mono text-foreground select-all">
                      {detailModalLog.entityId}
                    </span>
                  </div>
                )}
                {detailModalLog.userAgent && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[11px]">
                      User Agent
                    </span>
                    <span className="text-muted-foreground font-mono truncate block">
                      {detailModalLog.userAgent}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-foreground block mb-1.5">
                  Payload / Details:
                </span>
                <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-60 border border-zinc-800">
                  {JSON.stringify(detailModalLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
