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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { INTAKE_DISABLED_STATUSES } from "@plane/constants";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { ContentWrapper } from "@plane/ui";
// hooks
import { useIntakePermissions } from "@/hooks/use-intake-permissions";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
// local imports
import { InboxIssueMainContent } from "./work-item-root";

type TIntakeDetailContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
};

export const IntakeDetailContentRoot = observer(function IntakeDetailContentRoot(props: TIntakeDetailContentRoot) {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  // hooks
  const { fetchInboxIssueById, getIssueInboxByIssueId } = useProjectInbox();
  const inboxIssue = getIssueInboxByIssueId(inboxIssueId);
  const { isEditable, readOnly } = useIntakePermissions(workspaceSlug, projectId, inboxIssue);

  useSWR(
    workspaceSlug && projectId && inboxIssueId
      ? `PROJECT_INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${inboxIssueId}`
      : null,
    workspaceSlug && projectId && inboxIssueId
      ? () => fetchInboxIssueById(workspaceSlug, projectId, inboxIssueId)
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  if (!inboxIssue) return null;

  const isIssueDisabled =
    typeof inboxIssue.status === "number" &&
    (INTAKE_DISABLED_STATUSES as readonly number[]).includes(inboxIssue.status);

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <ContentWrapper className="divide-y-2 divide-subtle-1">
        <InboxIssueMainContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          inboxIssue={inboxIssue}
          isEditable={isEditable && !isIssueDisabled && !readOnly}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </ContentWrapper>
    </div>
  );
});
