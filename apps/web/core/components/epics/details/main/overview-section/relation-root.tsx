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

import React from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { Button } from "@plane/propel/button";
import { WorkItemsIcon } from "@plane/propel/icons";
import { EIssueServiceType } from "@plane/types";
// components
import { RelationActionButton, RelationsCollapsibleContent } from "@/components/issues/issue-detail-widgets/relations";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web
import { useCustomRelationOptions } from "@/components/relations";
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";

type Props = {
  workspaceSlug: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicRelationsOverviewRoot = observer(function EpicRelationsOverviewRoot(props: Props) {
  const { workspaceSlug, epicId, disabled = false } = props;
  // store hooks
  const {
    relation: { getRelationsByIssueId },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const relations = getRelationsByIssueId(epicId);
  const RELATION_OPTIONS = useCustomRelationOptions();
  const isRelationsEmpty = Object.keys(relations || {})
    .filter((key) => !!RELATION_OPTIONS[key])
    .every((key) => isEmpty(relations?.[key]));

  return (
    <>
      {isRelationsEmpty ? (
        <>
          <SectionEmptyState
            heading="No relations yet"
            subHeading="Start adding relations to manage and track the progress of the epic."
            icon={<WorkItemsIcon className="size-4" />}
            actionElement={
              <RelationActionButton
                issueId={epicId}
                issueServiceType={EIssueServiceType.EPICS}
                disabled={disabled}
                customButton={
                  <Button variant="secondary" size="base" disabled={disabled}>
                    Add relation
                  </Button>
                }
              />
            }
          />
        </>
      ) : (
        <RelationsCollapsibleContent
          workspaceSlug={workspaceSlug}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
    </>
  );
});
