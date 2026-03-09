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
import { useState } from "react";
import { Table } from "@plane/ui";
import { observer } from "mobx-react";
import { useMemberColumns } from "./helper";
import type { RowData } from "./helper";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { RemoveMemberModal } from "../remove-member-modal";
import { ToggleRoleModal } from "../toggle-role-modal";
import { Button } from "@plane/propel/button";
import useSWR from "swr";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export const UserListRoot: FC = observer(function UserListRoot() {
  // state
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);
  const [toggleRoleModalData, setToggleRoleModalData] = useState<{ rowData: RowData; role: "user" | "admin" } | null>(
    null
  );
  // store hooks
  const { fetchUsers, prevPage, nextPage, hasPrevPage, hasNextPage, loader, userIds, users } = useInstanceUser();

  // Handlers
  const handleRemoveMember = (rowData: RowData) => {
    setRemoveMemberModal(rowData);
  };

  const handleToggleRole = (rowData: RowData, role: "user" | "admin") => {
    setToggleRoleModalData({ rowData, role });
  };

  const columns = useMemberColumns({ handleRemoveMember, handleToggleRole });

  // SWR
  useSWR(`USER_MANAGEMENT_LIST`, () => fetchUsers(), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  if (userIds.length === 0 && !loader)
    return (
      <div className="py-5">
        <EmptyStateCompact title={"No matching results"} assetKey="search" assetClassName="size-20" align="center" />
      </div>
    );

  const tableData = userIds.map((userId) => ({
    member: users[userId],
  }));

  return (
    <>
      <div className="mt-3">
        <div className="overflow-scroll">
          <Table
            columns={columns}
            data={tableData}
            keyExtractor={(rowData) => rowData.member.id}
            tHeadClassName="border-b border-t border-subtle"
            thClassName="text-left font-medium divide-x-0 text-placeholder py-1"
            tBodyClassName="divide-y-0"
            tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
            tHeadTrClassName="divide-x-0"
            isLoading={loader}
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end mt-4 px-4">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => prevPage()} disabled={!hasPrevPage || loader}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => nextPage()} disabled={!hasNextPage || loader}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {removeMemberModal && (
        <RemoveMemberModal
          isOpen={!!removeMemberModal}
          onClose={() => setRemoveMemberModal(null)}
          data={removeMemberModal}
        />
      )}

      {/* Toggle Role Modal */}
      {toggleRoleModalData && (
        <ToggleRoleModal
          isOpen={!!toggleRoleModalData}
          onClose={() => setToggleRoleModalData(null)}
          data={toggleRoleModalData.rowData}
          role={toggleRoleModalData.role}
        />
      )}
    </>
  );
});
