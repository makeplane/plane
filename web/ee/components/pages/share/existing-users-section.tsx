"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
// plane imports
import { EPageSharedUserAccess } from "@plane/types";
import { Avatar, Collapsible } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { TPageShareFormUser } from "../../../hooks/pages/use-page-share-form";
import { UserListItem } from "./user-list-item";

type TExistingUsersSectionProps = {
  existingUsers: TPageShareFormUser[];
  onUpdateAccess: (userId: string, access: EPageSharedUserAccess) => void;
  onRemove: (userId: string) => void;
  getMemberDetails: (userId: string) => any;
  isUserModified: (userId: string) => boolean;
  isAccordionOpen: boolean;
  onToggleAccordion: () => void;
  canCurrentUserChangeAccess?: boolean;
};

export const ExistingUsersSection = ({
  existingUsers,
  onUpdateAccess,
  onRemove,
  getMemberDetails,
  isUserModified,
  isAccordionOpen,
  onToggleAccordion,
  canCurrentUserChangeAccess = true,
}: TExistingUsersSectionProps) => {
  if (existingUsers.length === 0) return null;

  return (
    <div className="mt-3 transition-all duration-300 ease-in-out">
      <Collapsible
        isOpen={isAccordionOpen}
        onToggle={onToggleAccordion}
        title={
          <div className="flex items-center justify-between w-full p-1">
            <div className="flex items-center gap-3">
              {!isAccordionOpen && (
                <div className="flex items-center transition-all duration-300 ease-in-out">
                  {existingUsers.slice(0, 3).map((user, index) => {
                    const memberDetails = getMemberDetails(user.user_id);
                    return (
                      <div
                        key={user.user_id}
                        className={`relative ${index > 0 ? "-ml-2.5" : ""} transition-all duration-200 ease-in-out`}
                        style={{ zIndex: index + 1 }}
                      >
                        <div className="ring-2 ring-custom-background-100 rounded-full">
                          <Avatar
                            name={memberDetails?.member?.display_name || "Unknown User"}
                            src={getFileURL(memberDetails?.member?.avatar_url || "")}
                            size="md"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {existingUsers.length > 3 && (
                    <div
                      className="flex items-center justify-center w-5 h-5 -ml-2 rounded-full bg-custom-background-80 text-custom-text-200 text-xs font-normal ring-2 ring-custom-background-100 transition-all duration-200 ease-in-out"
                      style={{ zIndex: 4 }}
                    >
                      +{existingUsers.length - 3}
                    </div>
                  )}
                </div>
              )}
              <h4 className="text-sm font-medium text-custom-text-300">Visible to</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-custom-text-400">
                {existingUsers.length} {existingUsers.length === 1 ? "member" : "members"}
              </span>
              <ChevronDown
                className={`h-3 w-3 text-custom-text-400 transition-transform duration-200 ${isAccordionOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        }
        buttonClassName="w-full hover:bg-custom-background-90 rounded transition-colors"
      >
        {/* User list */}
        <div className="mt-2 space-y-2 transition-all duration-300 ease-in-out">
          {existingUsers.map((user) => {
            const memberDetails = getMemberDetails(user.user_id);
            const isOwner = Boolean(user.isOwner);

            return (
              <UserListItem
                key={user.user_id}
                userId={user.user_id}
                displayName={memberDetails?.member?.display_name}
                avatarUrl={memberDetails?.member?.avatar_url}
                access={user.access}
                isModified={isUserModified(user.user_id)}
                isOwner={isOwner}
                onUpdateAccess={canCurrentUserChangeAccess ? onUpdateAccess : () => {}}
                onRemove={canCurrentUserChangeAccess ? onRemove : () => {}}
                canCurrentUserChangeAccess={canCurrentUserChangeAccess}
                className="hover:bg-custom-background-80 rounded transition-colors p-1"
              />
            );
          })}
        </div>
      </Collapsible>
    </div>
  );
};

ExistingUsersSection.displayName = "ExistingUsersSection";
