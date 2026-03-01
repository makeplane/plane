/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import type { EPageSharedUserAccess, IWorkspaceMember } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { Avatar, Loader } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import type { TPageShareFormUser } from "../../../hooks/pages/use-page-share-form";
import { UserListItem } from "./user-list-item";

type TExistingUsersSectionProps = {
  existingUsers: TPageShareFormUser[];
  onUpdateAccess: (userId: string, access: EPageSharedUserAccess) => void;
  onRemove: (userId: string) => void;
  getMemberDetails: (userId: string) => IWorkspaceMember | undefined;
  isUserModified: (userId: string) => boolean;
  isAccordionOpen: boolean;
  onToggleAccordion: () => void;
  canCurrentUserChangeAccess?: boolean;
  isLoading?: boolean;
};

export function ExistingUsersSection({
  existingUsers,
  onUpdateAccess,
  onRemove,
  getMemberDetails,
  isUserModified,
  isAccordionOpen,
  onToggleAccordion,
  canCurrentUserChangeAccess = true,
  isLoading = false,
}: TExistingUsersSectionProps) {
  // Show skeleton while loading and no existing users
  if (isLoading && existingUsers.length === 0) {
    return (
      <div className="mt-3 space-y-2 transition-all duration-300 ease-in-out">
        <Loader className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Loader.Item height="24px" width="24px" className="rounded-full" />
                <Loader.Item height="16px" width="120px" />
              </div>
              <Loader.Item height="24px" width="70px" className="rounded-md" />
            </div>
          ))}
        </Loader>
      </div>
    );
  }

  if (existingUsers.length === 0) return null;

  return (
    <div className="mt-3 transition-all duration-300 ease-in-out">
      <Collapsible
        open={isAccordionOpen}
        onOpenChange={(open) => {
          if (open !== isAccordionOpen) {
            onToggleAccordion();
          }
        }}
        className="w-full"
      >
        <CollapsibleTrigger className="w-full hover:bg-layer-1 rounded-sm transition-colors">
          <div className="flex items-center justify-between w-full p-1 hover:bg-layer-transparent-hover">
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
                        <div className="rounded-full">
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
                      className="flex items-center justify-center w-5 h-5 -ml-2 rounded-full bg-layer-1 text-secondary text-11 font-normal transition-all duration-200 ease-in-out"
                      style={{ zIndex: 4 }}
                    >
                      +{existingUsers.length - 3}
                    </div>
                  )}
                </div>
              )}
              <h4 className="text-13 font-medium text-tertiary">Visible to</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-11 text-placeholder">
                {existingUsers.length} {existingUsers.length === 1 ? "member" : "members"}
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 text-placeholder transition-transform duration-200 ${isAccordionOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
                  className="hover:bg-layer-1 rounded-sm transition-colors p-1"
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

ExistingUsersSection.displayName = "ExistingUsersSection";
