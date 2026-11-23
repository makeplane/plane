/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { DueDateOutline, LabelsOutline, LinkOutline, PriorityOutline, StateOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
// components
import { IssueBlockDate } from "@/components/issues/issue-layouts/properties/due-date";
import { IssueBlockLabels } from "@/components/issues/issue-layouts/properties/labels";
import { IssueBlockPriority } from "@/components/issues/issue-layouts/properties/priority";
import { IssueBlockState } from "@/components/issues/issue-layouts/properties/state";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
// types
import type { IIssue, IPeekMode } from "@/types/issue";
// local imports
import { PeekPropertyRow } from "./property-row";

/** Peek values read as primary text in a ghost field rather than as board pills. */
const PEEK_SELECT_CLASSNAME = "disabled:text-primary!";

type Props = {
  issueDetails: IIssue;
  mode?: IPeekMode;
};

export const PeekOverviewIssueProperties = observer(function PeekOverviewIssueProperties({
  issueDetails,
  mode,
}: Props) {
  // hooks
  const { t } = useTranslation();

  const { anchor } = useParams();

  const { project_details } = usePublish(anchor?.toString());

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: "info",
        title: "Link copied!",
        message: "Work item link copied to clipboard",
      });
    });
  };

  return (
    <div className={mode === "full" ? "divide-y divide-subtle-1" : ""}>
      {mode === "full" && (
        <div className="flex justify-between gap-2 pb-3">
          <h6 className="flex items-center gap-2 text-body-xs-medium">
            {project_details?.identifier}-{issueDetails.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("copy_link")}
              onClick={handleCopyLink}
              icon={<Icon icon={<LinkOutline className="-rotate-45" />} />}
            />
          </div>
        </div>
      )}
      <div className={`flex flex-col gap-1 ${mode === "full" ? "pt-3" : ""}`}>
        <PeekPropertyRow icon={StateOutline} label={t("common.state")}>
          <IssueBlockState
            stateId={issueDetails.state_id ?? undefined}
            variant="select-ghost-md"
            className={PEEK_SELECT_CLASSNAME}
          />
        </PeekPropertyRow>

        <PeekPropertyRow icon={PriorityOutline} label={t("common.priority")}>
          <IssueBlockPriority
            priority={issueDetails.priority}
            variant="select-ghost-md"
            className={PEEK_SELECT_CLASSNAME}
          />
        </PeekPropertyRow>

        <PeekPropertyRow icon={DueDateOutline} label={t("common.order_by.due_date")}>
          <IssueBlockDate
            date={issueDetails.target_date}
            stateId={issueDetails.state_id ?? undefined}
            variant="select-ghost-md"
            placeholder={t("common.none")}
            className={PEEK_SELECT_CLASSNAME}
          />
        </PeekPropertyRow>

        <PeekPropertyRow icon={LabelsOutline} label={t("common.labels")}>
          <IssueBlockLabels
            labelIds={issueDetails.label_ids ?? []}
            variant="select-ghost-md"
            placeholder={t("common.none")}
            className={PEEK_SELECT_CLASSNAME}
          />
        </PeekPropertyRow>
      </div>
    </div>
  );
});
