/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader as LoaderIcon } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { UserListItem } from "@/components/users/list-item";
// hooks
import { useInstanceUser } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const UserManagementPage = observer(function UserManagementPage(_props: Route.ComponentProps) {
  // store
  const { userIds, loader, paginationInfo, fetchUsers, fetchNextUsers } = useInstanceUser();
  // derived values
  const hasNextPage = paginationInfo?.next_page_results && paginationInfo?.next_cursor !== undefined;

  // fetch data
  useSWR("INSTANCE_USERS", () => fetchUsers());

  return (
    <PageWrapper
      header={{
        title: "Users on this instance",
        description: "View all users and deactivate or reactivate their accounts.",
      }}
    >
      {loader !== "init-loader" ? (
        <>
          <div className="flex items-center gap-2 text-16 font-medium pt-6 pb-2">
            All users on this instance
            <span className="text-tertiary">• {paginationInfo?.total_results ?? userIds.length}</span>
            {loader && ["mutation", "pagination"].includes(loader) && (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            )}
          </div>
          <div className="flex flex-col gap-3">
            {userIds.map((userId) => (
              <UserListItem key={userId} userId={userId} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="link"
                size="lg"
                onClick={() => fetchNextUsers()}
                disabled={loader === "pagination"}
              >
                Load more
                {loader === "pagination" && <LoaderIcon className="h-3 w-3 animate-spin" />}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Loader className="space-y-10 py-8">
          <Loader.Item height="24px" width="20%" />
          <Loader.Item height="64px" width="100%" />
          <Loader.Item height="64px" width="100%" />
          <Loader.Item height="64px" width="100%" />
          <Loader.Item height="64px" width="100%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "User Management - God Mode" }];

export default UserManagementPage;
