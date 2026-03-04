/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceBulkAssignForm } from "@/components/workspace/workspace-bulk-assign-form";
import type { Route } from "./+types/page";

function WorkspaceBulkAssignPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk assign workspace members",
        description: "Upload an Excel file to add users to workspaces at once.",
      }}
    >
      <div className="pt-4">
        <WorkspaceBulkAssignForm />
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Bulk Assign Workspace Members - God Mode" }];

export default WorkspaceBulkAssignPage;
