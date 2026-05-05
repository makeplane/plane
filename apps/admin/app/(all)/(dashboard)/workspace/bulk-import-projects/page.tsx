/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceProjectBulkImportForm } from "@/components/workspace/workspace-project-bulk-import-form";
// types
import type { Route } from "./+types/page";

function WorkspaceProjectBulkImportPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk import projects",
        description: "Upload an Excel file to create multiple projects across workspaces at once.",
      }}
    >
      <div className="pt-4">
        <WorkspaceProjectBulkImportForm />
      </div>
    </PageWrapper>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const meta: Route.MetaFunction = () => [{ title: "Bulk Import Projects - God Mode" }];

export default WorkspaceProjectBulkImportPage;
