/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageWrapper } from "@/components/common/page-wrapper";
import { DepartmentImportForm } from "./components/department-import-form";

export default function DepartmentImportPage() {
  return (
    <PageWrapper header={{ title: "Import Departments", description: "Bulk import departments from an Excel file." }}>
      <DepartmentImportForm />
    </PageWrapper>
  );
}
