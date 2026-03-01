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
// plane imports
import { EIssueLayoutTypes } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// local imports
import { IssueLayoutEmptyState } from "./empty-states";
import { WorkItemLayoutActiveLoader } from "./loaders";

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
  layout: EIssueLayoutTypes;
}

export const IssueLayoutHOC = observer(function IssueLayoutHOC(props: Props) {
  const { layout } = props;

  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);

  const issueCount = issues.getGroupIssueCount(undefined, undefined, false);

  if (issues?.getIssueLoader() === "init-loader" || issueCount === undefined) {
    return <WorkItemLayoutActiveLoader layout={layout} />;
  }

  if (issues.getGroupIssueCount(undefined, undefined, false) === 0 && layout !== EIssueLayoutTypes.CALENDAR) {
    return <IssueLayoutEmptyState storeType={storeType} />;
  }

  return <>{props.children}</>;
});
