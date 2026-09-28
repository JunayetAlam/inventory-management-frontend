"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import useIsAdmin from "@/hooks/useIsAdmin";
import useHandleSearchParams from "@/hooks/useHandleSearchParams";
import { useGetAllUsersQuery, useGetMeQuery } from "@/redux/api/userApi";
import { TQueryParam, User } from "@/types";
import { roleLabel } from "@/utils/userAccess";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DefaultPagination from "../Global/Pagination";
import TableSkeleton from "../Global/TableSkeleton";
import CreateUserDialog from "./CreateUserDialog";
import StatusBadge, { UserName } from "./StatusBadge";
import UserActions from "./UserActions";
import { Badge } from "@/components/ui/badge";

const headers = ["Name", "Role", "Status", "Phone", "Actions"];

export default function UsersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleSetSearchParams } = useHandleSearchParams();
  const [isAdmin, isAdminLoading] = useIsAdmin();
  const { data: me } = useGetMeQuery(undefined);
  const actorRole = me?.data?.role;

  const searchTerm = searchParams.get("searchTerm") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  const [search, setSearch] = useState(searchTerm);

  const args: TQueryParam[] = [
    { name: "page", value: page },
    { name: "limit", value: limit },
  ];
  if (searchTerm) args.push({ name: "searchTerm", value: searchTerm });
  if (role) args.push({ name: "role", value: role });
  if (status) args.push({ name: "status", value: status });

  const { data, isLoading } = useGetAllUsersQuery(args, {
    skip: !isAdmin,
  });

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAdminLoading, router]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    handleSetSearchParams({ searchTerm: search, page: "1" });
  };

  if (isAdminLoading || !isAdmin) {
    return <TableSkeleton headers={headers} title="Users" />;
  }

  const users = (data?.data || []) as User[];
  const meta = data?.meta;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Manage Users</h1>
        <CreateUserDialog />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or phone"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <Select
          value={role || "all"}
          onValueChange={(value) =>
            handleSetSearchParams({ role: value === "all" ? "" : value, page: "1" })
          }
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="SUPERADMIN">Super admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="CASHIER">Cashier</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status || "all"}
          onValueChange={(value) =>
            handleSetSearchParams({ status: value === "all" ? "" : value, page: "1" })
          }
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton headers={headers} showHeader={false} />
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length} className="py-10 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    index={index}
                    className={user.status === "PENDING" ? "bg-amber-50/70" : undefined}
                  >
                    <TableCell>
                      <UserName user={user} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roleLabel[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phoneNumber || "—"}
                    </TableCell>
                    <TableCell>
                      <UserActions user={user} actorRole={actorRole} compact />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {meta ? <DefaultPagination meta={meta} /> : null}
    </div>
  );
}
