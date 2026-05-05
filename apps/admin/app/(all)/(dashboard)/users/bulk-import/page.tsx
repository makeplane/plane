/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { BulkImportForm } from "@/components/users/bulk-import-form";
// types
import type { Route } from "./+types/page";

function BulkImportPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk import users",
        description: "Import multiple users from a CSV file.",
      }}
    >
      <div className="pt-4">
        <BulkImportForm />
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Bulk Import Users - God Mode" }];

export default BulkImportPage;
