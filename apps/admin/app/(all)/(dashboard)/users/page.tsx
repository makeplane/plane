/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Loader as LoaderIcon, Search } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { UserListItem } from "@/components/users/user-list-item";
// hooks
import { useInstanceUser } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const UserManagementPage = observer(function UserManagementPage(_props: Route.ComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { users, userIds, loader, paginationInfo, fetchUsers, fetchNextUsers } = useInstanceUser();

  const hasNextPage = paginationInfo?.next_page_results === true;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSWR("INSTANCE_USERS", () => fetchUsers());

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchUsers(value);
      }, 300);
    },
    [fetchUsers]
  );

  return (
    <PageWrapper
      header={{
        title: "Users on this instance",
        description: "Manage all users and their workspace assignments.",
      }}
    >
      <div className="space-y-3">
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-placeholder" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/users/bulk-import" className={getButtonStyling("secondary", "base")}>
              Bulk import
            </Link>
            <Link href="/users/create" className={getButtonStyling("primary", "base")}>
              Create user
            </Link>
          </div>
        </div>

        {loader !== "init-loader" ? (
          <>
            <div className="flex items-center gap-2 text-16 font-medium pt-2">
              All users <span className="text-tertiary">• {userIds.length}</span>
              {loader && ["mutation", "pagination"].includes(loader) && <LoaderIcon className="w-4 h-4 animate-spin" />}
            </div>
            <div className="flex flex-col gap-3 py-2">
              {userIds.length === 0 ? (
                <div className="text-center py-10 text-tertiary">
                  {searchQuery ? "No users match your search." : "No users found."}
                </div>
              ) : (
                userIds.map((userId) => <UserListItem key={userId} user={users[userId]} />)
              )}
            </div>
            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="lg"
                  onClick={() => void fetchNextUsers()}
                  disabled={loader === "pagination"}
                >
                  Load more
                  {loader === "pagination" && <LoaderIcon className="w-3 h-3 animate-spin" />}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Loader className="space-y-10 py-8">
            <Loader.Item height="24px" width="20%" />
            <Loader.Item height="60px" width="100%" />
            <Loader.Item height="60px" width="100%" />
            <Loader.Item height="60px" width="100%" />
          </Loader>
        )}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "User Management - God Mode" }];

export default UserManagementPage;
