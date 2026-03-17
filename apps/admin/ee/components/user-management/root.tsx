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

import type { FC } from "react";
import { observer } from "mobx-react";
import { useEffect, useMemo, useState } from "react";
import { PageWrapper } from "@/components/common/page-wrapper";
import { Button } from "@plane/propel/button";
import { AddIcon, SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
import { UserListRoot } from "./list/members-list-root";
import { InviteMembersModal } from "./invite-members/modal";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { debounce } from "lodash-es";

export const UserManagementRoot: FC = observer(function UserManagementRoot() {
  // store hooks
  const { setSearchQuery: setStoreSearchQuery } = useInstanceUser();
  // state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isInviteMembersModalOpen, setIsInviteMembersModalOpen] = useState(false);

  // handlers
  const debounceSearchQuery = useMemo(
    () => debounce((query: string) => setStoreSearchQuery(query), 500),
    [setStoreSearchQuery]
  );
  useEffect(() => () => debounceSearchQuery.cancel(), [debounceSearchQuery]);

  return (
    <>
      {/* Modals */}
      <InviteMembersModal isOpen={isInviteMembersModalOpen} onClose={() => setIsInviteMembersModalOpen(false)} />
      <PageWrapper size="lg">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h4 className="text-h4-medium font-heading text-20 text-primary">User Management</h4>
            <span className="text-body-sm-regular text-14 text-secondary">
              View and manage seats for all the members active in this instance
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-1">
              <SearchIcon className="size-3.5 text-placeholder" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debounceSearchQuery(e.target.value);
                }}
                className="border-none p-0 rounded-none bg-transparent"
                placeholder="Search..."
              />
            </div>
            <Button
              variant="primary"
              size="base"
              prependIcon={<AddIcon className="size-4" />}
              onClick={() => setIsInviteMembersModalOpen(true)}
            >
              Invite members
            </Button>
          </div>
        </div>
        {/* Members List   */}
        <UserListRoot />
      </PageWrapper>
    </>
  );
});
