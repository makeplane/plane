"use client";

import { useTheme } from "next-themes";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
import { AccessMenu } from "./access-menu";

type TUserListItemProps = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  access: number;
  isModified?: boolean;
  isOwner?: boolean;
  onUpdateAccess: (userId: string, access: number) => void;
  onRemove: (userId: string) => void;
  className?: string;
  canCurrentUserChangeAccess?: boolean;
};

export const UserListItem = ({
  userId,
  displayName,
  avatarUrl,
  access,
  isModified = false,
  isOwner = false,
  onUpdateAccess,
  onRemove,
  className = "",
  canCurrentUserChangeAccess = true,
}: TUserListItemProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar name={displayName || "Unknown User"} src={getFileURL(avatarUrl || "")} size="base" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-normal text-custom-text-100 truncate">{displayName || "Unknown User"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isModified && (
          <span
            className={cn(
              "px-[4px] py-[2px] text-xs font-medium rounded-[4px]",
              { "text-[#FF9500] bg-[#804A00]": resolvedTheme === "dark" },
              { "text-[#FF9500] bg-[#FFEACC]": resolvedTheme === "light" }
            )}
          >
            Modified
          </span>
        )}
        <AccessMenu
          currentAccess={access}
          onUpdateAccess={(accessValue) => onUpdateAccess(userId, parseInt(accessValue) as number)}
          onRemove={() => onRemove(userId)}
          isOwner={isOwner}
          canCurrentUserChangeAccess={canCurrentUserChangeAccess}
        />
      </div>
    </div>
  );
};

UserListItem.displayName = "UserListItem";
