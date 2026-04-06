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

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  isDefault?: boolean;
  workItemTypeIds: string[];
};

export const WorkflowCardFooter = observer(function WorkflowCardFooter(props: Props) {
  const { isDefault = false, workItemTypeIds } = props;
  // hooks
  const { t } = useTranslation();
  const { getIssueTypeById } = useIssueTypes();

  if (isDefault) {
    return (
      <div className="border-t border-subtle bg-layer-1 px-4 py-3">
        <p className="text-caption-md-regular text-secondary">
          {t("project_settings.workflows.default_footer.fallback_message")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-t border-subtle bg-layer-1 px-4 py-3">
      {workItemTypeIds.map((id) => {
        const workItemType = getIssueTypeById(id);
        if (!workItemType) return null;
        return (
          <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-2 p-1" key={id}>
            <IssueTypeIdentifier issueTypeId={id} size="xs" />
            <span className="text-caption-md-regular">{workItemType.name}</span>
          </div>
        );
      })}
    </div>
  );
});
