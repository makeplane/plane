"use client";

import React, { memo } from "react";
import { Users } from "lucide-react";
// plane ui
import { Loader } from "@plane/ui";

type TEmptyStateProps = {
  isLoading: boolean;
  totalUsers: number;
  pendingUsersCount: number;
  existingUsersCount?: number;
};

export const EmptyState = memo<TEmptyStateProps>(
  ({ isLoading, totalUsers, pendingUsersCount, existingUsersCount = 0 }) => {
    if (isLoading && existingUsersCount <= 1) {
      return (
        <div className="mt-2 space-y-2 transition-all duration-300 ease-in-out">
          <Loader className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded transition-colors p-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Loader.Item height="24px" width="24px" className="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Loader.Item height="16px" width="120px" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Loader.Item height="24px" width="70px" className="rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </Loader>
        </div>
      );
    }

    if (existingUsersCount > 0 || pendingUsersCount > 0) {
      return null;
    }

    if (totalUsers === 0 && pendingUsersCount === 0) {
      return (
        <div className="text-center py-8 animate-in fade-in duration-500 transition-all ease-in-out">
          <div className="w-16 h-16 bg-custom-background-80 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-custom-text-300" />
          </div>
          <h4 className="text-sm font-medium text-custom-text-200 mb-1">No one has access yet</h4>
          <p className="text-xs text-custom-text-400">Add people above to start collaborating on this page</p>
        </div>
      );
    }

    return null;
  }
);

EmptyState.displayName = "EmptyState";
