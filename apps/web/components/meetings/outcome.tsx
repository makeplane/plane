/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types";
// components
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
import { useProductUpdate } from "@/components/products/use-product";
// local imports
import { useMeeting } from "./use-meeting";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

/** What came out of a meeting. */
export const MeetingOutcome = observer(function MeetingOutcome(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const { t } = useTranslation();
  const { meeting } = useMeeting(workspaceSlug, projectId, issueId);
  const update = useProductUpdate(workspaceSlug, projectId, issueId);

  if (!meeting) return null;

  return (
    <section aria-label={t("meeting.outcome")} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h6 className="text-body-sm-semibold text-primary">{t("meeting.outcome")}</h6>
        <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
      </div>
      <DescriptionInput
        key={issueId}
        containerClassName="-ml-6 border-none p-0! pl-6!"
        disabled={disabled}
        entityId={issueId}
        fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
        initialValue={meeting.outcome_html}
        placeholder={t("meeting.outcome_placeholder")}
        projectId={projectId}
        setIsSubmitting={setIsSubmitting}
        workspaceSlug={workspaceSlug}
        onSubmit={async ({ description_html }) => {
          await update({ meeting: { outcome_html: description_html } });
        }}
      />
    </section>
  );
});
