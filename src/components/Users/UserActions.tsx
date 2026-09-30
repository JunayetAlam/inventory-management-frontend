"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { User, UserRoleEnum } from "@/types";
import { canManageUser } from "@/utils/userAccess";
import { Button } from "@/components/ui/button";
import ConfirmPopup from "../Global/ConfirmPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import {
  useDeleteUserMutation,
  useLogoutUserSessionsMutation,
  useUndeleteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from "@/redux/api/userApi";

type ActionType =
  | "activate"
  | "deactivate"
  | "block"
  | "unblock"
  | "logout"
  | "delete"
  | "restore";

export default function UserActions({
  user,
  actorRole,
  compact = false,
}: {
  user: User;
  actorRole?: UserRoleEnum | string;
  compact?: boolean;
}) {
  const canManage = canManageUser(actorRole, user.role);
  const isSuperAdmin = actorRole === "SUPERADMIN";
  const [roleOpen, setRoleOpen] = useState(false);
  const [nextRole, setNextRole] = useState(user.role === "ADMIN" ? "CASHIER" : "ADMIN");
  const [menuAction, setMenuAction] = useState<ActionType | null>(null);
  const menuActionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [logoutSessions, { isLoading: isLoggingOut }] = useLogoutUserSessionsMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [undeleteUser, { isLoading: isRestoring }] = useUndeleteUserMutation();

  const loading =
    isUpdatingStatus || isUpdatingRole || isLoggingOut || isDeleting || isRestoring;

  useEffect(() => {
    return () => {
      if (menuActionTimer.current) clearTimeout(menuActionTimer.current);
    };
  }, []);

  const scheduleMenuAction = (type: ActionType) => {
    if (menuActionTimer.current) clearTimeout(menuActionTimer.current);
    menuActionTimer.current = setTimeout(() => {
      setMenuAction(type);
    }, 150);
  };

  const run = async (fn: () => Promise<unknown>, success: string) => {
    const toastId = toast.loading("Updating...");
    try {
      await fn();
      toast.success(success, { id: toastId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Action failed", { id: toastId });
      throw error;
    }
  };

  const confirmCopy: Record<
    ActionType,
    { title: string; description: string; confirmLabel: string }
  > = {
    activate: {
      title: "Activate user?",
      description: "This user will be able to sign in.",
      confirmLabel: "Activate",
    },
    deactivate: {
      title: "Deactivate user?",
      description: "They will be signed out until activated again.",
      confirmLabel: "Deactivate",
    },
    block: {
      title: "Block user?",
      description: "They will be signed out of every device and cannot sign in.",
      confirmLabel: "Block",
    },
    unblock: {
      title: "Unblock user?",
      description: "This user will be able to sign in again.",
      confirmLabel: "Unblock",
    },
    logout: {
      title: "Log out all devices?",
      description: "Every active session for this user will be removed.",
      confirmLabel: "Log out",
    },
    delete: {
      title: "Delete user?",
      description: "The account will be removed and they will be signed out.",
      confirmLabel: "Delete",
    },
    restore: {
      title: "Restore user?",
      description: "This account will be available again.",
      confirmLabel: "Restore",
    },
  };

  const runAction = async (type: ActionType) => {
    if (type === "activate" || type === "unblock") {
      await run(
        () => updateStatus({ id: user.id, status: "ACTIVE" }).unwrap(),
        "User activated",
      );
      return;
    }
    if (type === "deactivate") {
      await run(
        () => updateStatus({ id: user.id, status: "INACTIVE" }).unwrap(),
        "User deactivated",
      );
      return;
    }
    if (type === "block") {
      await run(
        () => updateStatus({ id: user.id, status: "BLOCKED" }).unwrap(),
        "User blocked",
      );
      return;
    }
    if (type === "logout") {
      await run(() => logoutSessions(user.id).unwrap(), "User logged out");
      return;
    }
    if (type === "delete") {
      await run(() => deleteUser(user.id).unwrap(), "User deleted");
      return;
    }
    if (type === "restore") {
      await run(() => undeleteUser(user.id).unwrap(), "User restored");
    }
  };

  const handleRoleSave = () => {
    run(
      () => updateRole({ id: user.id, role: nextRole }).unwrap(),
      "Role updated",
    ).then(() => setRoleOpen(false));
  };

  if (!canManage && compact) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/users/${user.id}`}>View</Link>
      </Button>
    );
  }

  const actionPopup = (type: ActionType, button: ReactNode) => (
    <ConfirmPopup
      title={confirmCopy[type].title}
      description={confirmCopy[type].description}
      confirmLabel={confirmCopy[type].confirmLabel}
      loading={loading}
      destructive={type === "delete" || type === "block"}
      onConfirm={() => runAction(type)}
    >
      {button}
    </ConfirmPopup>
  );

  const menu = (
    <>
      <DropdownMenuItem asChild>
        <Link href={`/users/${user.id}`}>View</Link>
      </DropdownMenuItem>
      {canManage && (user.status === "PENDING" || user.status === "INACTIVE") ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("activate")}>
          Activate
        </DropdownMenuItem>
      ) : null}
      {canManage && user.status === "ACTIVE" ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("deactivate")}>
          Deactivate
        </DropdownMenuItem>
      ) : null}
      {canManage && user.status !== "BLOCKED" ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("block")}>
          Block
        </DropdownMenuItem>
      ) : null}
      {canManage && user.status === "BLOCKED" ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("unblock")}>
          Unblock
        </DropdownMenuItem>
      ) : null}
      {canManage ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("logout")}>
          Log out all devices
        </DropdownMenuItem>
      ) : null}
      {isSuperAdmin && canManage ? (
        <DropdownMenuItem
          onSelect={() => {
            setNextRole(user.role === "ADMIN" ? "CASHIER" : "ADMIN");
            setRoleOpen(true);
          }}
        >
          Change role
        </DropdownMenuItem>
      ) : null}
      {canManage && !user.isDeleted ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => scheduleMenuAction("delete")}
          >
            Delete
          </DropdownMenuItem>
        </>
      ) : null}
      {isSuperAdmin && user.isDeleted ? (
        <DropdownMenuItem onSelect={() => scheduleMenuAction("restore")}>
          Restore
        </DropdownMenuItem>
      ) : null}
    </>
  );

  const actionButtons = canManage ? (
    <div className="flex flex-wrap gap-2">
      {(user.status === "PENDING" || user.status === "INACTIVE") &&
        actionPopup(
          "activate",
          <Button size="sm">Activate</Button>,
        )}
      {user.status === "ACTIVE" &&
        actionPopup(
          "deactivate",
          <Button size="sm" variant="outline">
            Deactivate
          </Button>,
        )}
      {user.status !== "BLOCKED" &&
        actionPopup(
          "block",
          <Button size="sm" variant="outline">
            Block
          </Button>,
        )}
      {user.status === "BLOCKED" &&
        actionPopup(
          "unblock",
          <Button size="sm" variant="outline">
            Unblock
          </Button>,
        )}
      {actionPopup(
        "logout",
        <Button size="sm" variant="outline">
          Log out all devices
        </Button>,
      )}
      {isSuperAdmin && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setNextRole(user.role === "ADMIN" ? "CASHIER" : "ADMIN");
            setRoleOpen(true);
          }}
        >
          Change role
        </Button>
      )}
      {!user.isDeleted &&
        actionPopup(
          "delete",
          <Button size="sm" variant="destructive">
            Delete
          </Button>,
        )}
      {isSuperAdmin &&
        user.isDeleted &&
        actionPopup(
          "restore",
          <Button size="sm" variant="outline">
            Restore
          </Button>,
        )}
    </div>
  ) : null;

  const menuCopy = menuAction ? confirmCopy[menuAction] : null;

  return (
    <>
      {compact ? (
        <div className="relative inline-flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="User actions">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {menu}
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover
            modal={false}
            open={Boolean(menuAction)}
            onOpenChange={(open) => {
              if (!open) setMenuAction(null);
            }}
          >
            <PopoverAnchor asChild>
              <span className="pointer-events-none absolute inset-0" aria-hidden />
            </PopoverAnchor>
            <PopoverContent
              side="left"
              align="center"
              sideOffset={8}
              className="w-56 gap-3 p-3"
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              {menuCopy ? (
                <>
                  <PopoverHeader>
                    <PopoverTitle className="text-sm">{menuCopy.title}</PopoverTitle>
                    <PopoverDescription className="text-xs">
                      {menuCopy.description}
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => setMenuAction(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={
                        menuAction === "delete" || menuAction === "block"
                          ? "destructive"
                          : "default"
                      }
                      disabled={loading}
                      onClick={async () => {
                        if (!menuAction) return;
                        try {
                          await runAction(menuAction);
                          setMenuAction(null);
                        } catch {
                          // Error toast is already shown.
                        }
                      }}
                    >
                      {loading ? "Working..." : menuCopy.confirmLabel}
                    </Button>
                  </div>
                </>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        actionButtons
      )}

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Superadmin can assign Admin or Cashier.
            </DialogDescription>
          </DialogHeader>
          <Select value={nextRole} onValueChange={setNextRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASHIER">Cashier</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRoleSave} disabled={loading}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
