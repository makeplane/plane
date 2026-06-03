/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceBulkAssignForm } from "@/components/workspace/workspace-bulk-assign-form";
import { WorkspaceBulkDeleteForm } from "@/components/workspace/workspace-bulk-delete-form";
import type { Route } from "./+types/page";

type Tab = "assign" | "delete";

const TABS: { id: Tab; label: string }[] = [
  { id: "assign", label: "Bulk Assign" },
  { id: "delete", label: "Bulk Delete" },
];

function WorkspaceBulkAssignPage(_props: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("assign");

  return (
    <PageWrapper
      header={{
        title: "Bulk workspace member management",
        description: "Upload an Excel file to add or remove workspace members at once.",
      }}
    >
      <div className="pt-4 space-y-6">
        <div className="flex gap-1 border-b border-border-subtle">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-secondary hover:text-primary",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "assign" ? <WorkspaceBulkAssignForm /> : <WorkspaceBulkDeleteForm />}
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Bulk Workspace Member Management - God Mode" }];

export default WorkspaceBulkAssignPage;
