/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { AddToWorkspaceDialog } from "@/components/users/add-to-workspace-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { UserDetailInfo } from "@/components/users/user-detail-info";
import { UserWorkspaceList } from "@/components/users/user-workspace-list";
// hooks
import { useInstanceUser } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const UserDetailPage = observer(function UserDetailPage({ params }: Route.ComponentProps) {
  const userId = params.userId;
  const { users, fetchUserDetail } = useInstanceUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useSWR(userId ? `USER_DETAIL_${userId}` : null, () => (userId ? fetchUserDetail(userId) : null));

  const user = userId ? users[userId] : undefined;

  return (
    <PageWrapper
      header={{
        title: user ? `${user.first_name || user.email}` : "User Detail",
        description: "View and manage user details and workspace assignments.",
      }}
    >
      {user ? (
        <div className="space-y-6 pt-4">
          <UserDetailInfo user={user} userId={userId} />
          <div className="flex items-center justify-between">
            <h3 className="text-16 font-medium">Workspace memberships</h3>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowResetDialog(true)}>
                Reset Password
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAddDialog(true)}>
                Add to Workspace
              </Button>
            </div>
          </div>
          <UserWorkspaceList workspaces={user.workspaces || []} />
          <div className="pt-2">
            <Link href="/users" className={getButtonStyling("secondary", "base")}>
              Back to users
            </Link>
          </div>
          <AddToWorkspaceDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            userId={userId}
            existingWorkspaceIds={(user.workspaces || []).map((w) => w.workspace)}
          />
          <ResetPasswordDialog open={showResetDialog} onClose={() => setShowResetDialog(false)} userId={userId} />
        </div>
      ) : (
        <Loader className="space-y-6 py-8">
          <Loader.Item height="100px" width="100%" />
          <Loader.Item height="200px" width="100%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "User Detail - God Mode" }];

export default UserDetailPage;
