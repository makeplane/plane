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

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";

type TWorkItemConversionToastActionItem = {
  workspaceSlug: string;
  workItemId: string | undefined;
};

export const WorkItemConversionToastActionItem = observer(function WorkItemConversionToastActionItem(
  props: TWorkItemConversionToastActionItem
) {
  const { workspaceSlug, workItemId } = props;
  // state
  const [copied, setCopied] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();
  const { t } = useTranslation();

  // derived values
  const workItem = workItemId ? getIssueById(workItemId) : undefined;
  const projectIdentifier = getProjectIdentifierById(workItem?.project_id);

  if (!workItem) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: workItem?.project_id,
    issueId: workItem?.id,
    projectIdentifier,
    sequenceId: workItem?.sequence_id,
    isEpic: workItem?.is_epic,
  });

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await copyUrlToClipboard(workItemLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1 text-11 text-secondary">
      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
      >
        {`${t("common.view")} ${workItem?.is_epic ? t("common.epic") : t("common.work_item")}`}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-secondary">{t("common.copied")}!</span>
        </>
      ) : (
        <>
          <button
            className="cursor-pointer hidden group-hover:flex px-2 py-1 text-tertiary hover:text-secondary hover:bg-layer-1 rounded"
            onClick={copyToClipboard}
          >
            {t("copy_link")}
          </button>
        </>
      )}
    </div>
  );
});
