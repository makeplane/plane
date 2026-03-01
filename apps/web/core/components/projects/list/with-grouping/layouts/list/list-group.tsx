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

import type { MutableRefObject } from "react";
import { Fragment, forwardRef, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane
import type { TIssueGroupByOptions, IIssueDisplayProperties } from "@plane/types";
//
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { groupDetails } from "../board/utils";
import { ProjectBlocksList } from "./blocks-list";
import { HeaderGroupByCard } from "./headers/group-by-card";

interface Props {
  groupedProjectIds: string[] | undefined;
  group: string;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup?: boolean;
}

// List loader component
const ListLoaderItemRow = forwardRef(function ListLoaderItemRow(
  props: Record<string, unknown>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div ref={ref} className="flex items-center justify-between h-11 p-3 border-b border-subtle-1">
      <div className="flex items-center gap-3">
        <span className="h-5 w-10 bg-layer-1 rounded animate-pulse" />
        <span className={`h-5 w-52 bg-layer-1 rounded animate-pulse`} />
      </div>
      <div className="flex items-center gap-2">
        {[...Array(6)].map((_, index) => (
          <Fragment key={index}>
            <span key={index} className="h-5 w-5 bg-layer-1 rounded animate-pulse" />
          </Fragment>
        ))}
      </div>
    </div>
  );
});
ListLoaderItemRow.displayName = "ListLoaderItemRow";

export const ListGroup = observer(function ListGroup(props: Props) {
  const { groupedProjectIds = [], group, groupBy } = props;
  const { getProjectStateById, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const { currentWorkspace } = useWorkspace();
  const { filters } = useProjectFilter();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const [isExpanded, setIsExpanded] = useState(true);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const toggleListGroup = () => {
    setIsExpanded((prevState) => !prevState);
  };

  // derived values
  const selectedGroupKey = filters?.display_filters?.group_by;

  const shouldExpand = isExpanded || !groupBy;
  const details = groupDetails(
    getProjectStateById,
    getProjectStatedByStateGroupKey,
    getWorkspaceMemberDetails,
    group,
    currentWorkspace,
    selectedGroupKey
  );

  return groupedProjectIds.length > 0 ? (
    <div ref={groupRef} className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`)}>
      <Row className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle bg-layer-1 py-1">
        <HeaderGroupByCard
          groupID={group}
          icon={details?.icon}
          title={details?.title || ""}
          toggleListGroup={toggleListGroup}
          count={groupedProjectIds.length}
        />
      </Row>
      {shouldExpand && (
        <div className="relative">{groupedProjectIds && <ProjectBlocksList projectIds={groupedProjectIds} />}</div>
      )}
    </div>
  ) : null;
});
