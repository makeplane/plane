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

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// types
import type { IProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";

const ARCHIVES_TAB_LIST: {
  key: string;
  label: string;
  shouldRender: (projectDetails: IProject & { epic_view: boolean }) => boolean;
}[] = [
  {
    key: "epics",
    label: "Epics",
    shouldRender: (projectDetails) => projectDetails.epic_view,
  },
  {
    key: "issues",
    label: "Work items",
    shouldRender: () => true,
  },
  {
    key: "cycles",
    label: "Cycles",
    shouldRender: (projectDetails) => projectDetails.cycle_view,
  },
  {
    key: "modules",
    label: "Modules",
    shouldRender: (projectDetails) => projectDetails.module_view,
  },
];

export const ArchiveTabsList = observer(function ArchiveTabsList() {
  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // store hooks
  const { getProjectById } = useProject();
  const { isEpicEnabledForProject } = useIssueTypes();
  // derived values
  if (!projectId) return null;
  const project = getProjectById(projectId?.toString());
  const isEpicEnabled = isEpicEnabledForProject(workspaceSlug, projectId);

  if (!project) return null;

  const projectDetails = { ...project, epic_view: isEpicEnabled };

  return (
    <>
      {ARCHIVES_TAB_LIST.map(
        (tab) =>
          tab.shouldRender(projectDetails) && (
            <Link key={tab.key} href={`/${workspaceSlug}/projects/${projectId}/archives/${tab.key}`}>
              <span
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 py-4 px-4 text-13 font-medium outline-none ${
                  pathname.includes(tab.key)
                    ? "border-accent-strong text-accent-primary"
                    : "border-transparent hover:border-subtle text-tertiary hover:text-placeholder"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
      )}
    </>
  );
});
