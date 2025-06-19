"use client";

import React from "react";
import { EPageSharedUserAccess } from "@plane/constants";
import { TPendingSharedUser } from "./types";
import { UserListItem } from "./user-list-item";

type TPendingUsersSectionProps = {
  pendingUsers: TPendingSharedUser[];
  onUpdateAccess: (userId: string, access: EPageSharedUserAccess) => void;
  onRemove: (userId: string) => void;
  getMemberDetails: (userId: string) => { member: { display_name: string; avatar_url: string } };
};

export const PendingUsersSection = ({
  pendingUsers,
  onUpdateAccess,
  onRemove,
  getMemberDetails,
}: TPendingUsersSectionProps) => {
  if (pendingUsers.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 transition-all duration-300 ease-in-out">
      {pendingUsers.map((user) => {
        const memberDetails = getMemberDetails(user.user_id);
        return (
          <UserListItem
            key={user.user_id}
            userId={user.user_id}
            displayName={memberDetails?.member?.display_name}
            avatarUrl={memberDetails?.member?.avatar_url}
            access={user.access}
            onUpdateAccess={onUpdateAccess}
            onRemove={onRemove}
            className="p-1 transition-all duration-200 ease-in-out"
          />
        );
      })}
    </div>
  );
};

PendingUsersSection.displayName = "PendingUsersSection";
