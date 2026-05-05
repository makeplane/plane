/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceBulkImportForm } from "@/components/workspace/workspace-bulk-import-form";
// types
import type { Route } from "./+types/page";

function WorkspaceBulkImportPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk import workspaces",
        description: "Upload an Excel file to create multiple workspaces at once.",
      }}
    >
      <div className="pt-4">
        <WorkspaceBulkImportForm />
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Bulk Import Workspaces - God Mode" }];

export default WorkspaceBulkImportPage;
