/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
// components
import { AddAdminDialog } from "@/components/administrators/add-admin-dialog";
import { AdministratorsTable } from "@/components/administrators/administrators-table";
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useAdminManagement } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const AdministratorsPage = observer(function AdministratorsPage(_props: Route.ComponentProps) {
  const { isLoading, adminIds, fetchAdmins } = useAdminManagement();
  const [isAddOpen, setIsAddOpen] = useState(false);

  useSWR("INSTANCE_ADMINS_MANAGEMENT", () => fetchAdmins());

  return (
    <PageWrapper
      header={{
        title: "Administrators",
        description: "Manage instance admins and the god-mode menus each one can access.",
        actions: (
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add admin
          </Button>
        ),
      }}
    >
      <div className="px-4">
        {isLoading && adminIds.length === 0 ? (
          <Loader className="space-y-3">
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
          </Loader>
        ) : (
          <AdministratorsTable />
        )}
      </div>
      <AddAdminDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </PageWrapper>
  );
});

export default AdministratorsPage;
