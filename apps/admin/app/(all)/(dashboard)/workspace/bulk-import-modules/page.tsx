/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceModuleBulkImportForm } from "@/components/workspace/workspace-module-bulk-import-form";
// types
import type { Route } from "./+types/page";

function WorkspaceModuleBulkImportPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk import modules",
        description: "Upload an Excel file to create multiple modules across projects at once.",
      }}
    >
      <div className="pt-4">
        <WorkspaceModuleBulkImportForm />
      </div>
    </PageWrapper>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const meta: Route.MetaFunction = () => [{ title: "Bulk Import Modules - God Mode" }];

export default WorkspaceModuleBulkImportPage;
