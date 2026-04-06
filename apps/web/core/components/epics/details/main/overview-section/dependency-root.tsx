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
import { DependencyPropertyIcon } from "@plane/propel/icons";
import { EIssueServiceType } from "@plane/types";
// components
import {
  DependencyActionButton,
  DependenciesCollapsibleContent,
} from "@/components/issues/issue-detail-widgets/dependencies";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { useDependencyOptions } from "@/components/relations";
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";
import type { TIssueRelationTypes } from "@/types";

type Props = {
  workspaceSlug: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicDependenciesOverviewRoot = observer(function EpicDependenciesOverviewRoot(props: Props) {
  const { workspaceSlug, epicId, disabled = false } = props;
  // store hooks
  const {
    relation: { getRelationsByIssueId },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const relations = getRelationsByIssueId(epicId);
  const DEPENDENCY_OPTIONS = useDependencyOptions();
  const isDependenciesEmpty = Object.keys(relations || {})
    .filter((key) => !!DEPENDENCY_OPTIONS[key as TIssueRelationTypes])
    .every((key) => isEmpty(relations?.[key as TIssueRelationTypes]));

  return (
    <>
      {isDependenciesEmpty ? (
        <SectionEmptyState
          heading="No dependencies yet"
          subHeading="Start adding dependencies to manage and track the progress of the epic."
          icon={<DependencyPropertyIcon className="size-4" />}
          actionElement={
            <DependencyActionButton
              issueId={epicId}
              issueServiceType={EIssueServiceType.EPICS}
              disabled={disabled}
              customButton={
                <Button variant="secondary" size="base" disabled={disabled}>
                  Add dependency
                </Button>
              }
            />
          }
        />
      ) : (
        <DependenciesCollapsibleContent
          workspaceSlug={workspaceSlug}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
    </>
  );
});
