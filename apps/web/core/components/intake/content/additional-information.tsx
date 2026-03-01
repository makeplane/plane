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
import { WorkItemsIcon } from "@plane/propel/icons";
import type { TIntakeIssueExtended, TIssue } from "@plane/types";
import { useIssueType } from "@/plane-web/hooks/store";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { IntakePropertyValues } from "./property-values";

type TIntakeAdditionalInformationProps = {
  workItemDetails: TIssue & TIntakeIssueExtended;
};

export const IntakeAdditionalInformation = observer(function IntakeAdditionalInformation(
  props: TIntakeAdditionalInformationProps
) {
  const { workItemDetails } = props;

  // derived values
  const additionalInformation = workItemDetails.additional_information;
  const workItemTypeId = workItemDetails.type_id;

  // hooks
  const workItemType = useIssueType(workItemTypeId);

  if (!additionalInformation || !workItemTypeId) return null;

  return (
    <div className="flex w-full flex-col divide-y-2 divide-subtle-1 py-4">
      <div className="w-full overflow-y-auto">
        <h5 className="text-13 font-medium my-4">Additional Information</h5>
        <div className="space-y-3">
          {/* Work item type */}
          <div className="flex items-center gap-2">
            <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
              <WorkItemsIcon className="size-4 flex-shrink-0" />
              <span>Work item type</span>
            </div>
            <div className="w-3/5 flex-grow group flex items-center gap-2">
              <IssueTypeIdentifier issueTypeId={workItemTypeId} />
              <span className="text-13 text-placeholder">{workItemType?.name}</span>
            </div>
          </div>
          {/* Values */}
          <IntakePropertyValues entries={additionalInformation} workItemType={workItemType} />
        </div>
      </div>
    </div>
  );
});
