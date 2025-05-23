"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { copyUrlToClipboard } from "@plane/utils";
// helpers
import { generateWorkItemLink } from "@/helpers/issue.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TConversionToastActionItems = {
  workspaceSlug: string;
  workItemId: string | undefined;
};

export const ConversionToastActionItems: FC<TConversionToastActionItems> = observer((props) => {
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
    } catch (error) {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1 text-xs text-custom-text-200">
      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
      >
        {`${t("common.view")} ${workItem?.is_epic ? t("common.epic") : t("work_item")}`}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-custom-text-200">{t("common.copied")}!</span>
        </>
      ) : (
        <>
          <button
            className="cursor-pointer hidden group-hover:flex px-2 py-1 text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-90 rounded"
            onClick={copyToClipboard}
          >
            {t("copy_link")}
          </button>
        </>
      )}
    </div>
  );
});
