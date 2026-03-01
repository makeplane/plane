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

import { useRef } from "react";
import { observer } from "mobx-react";
// types
import type { TGroupedIssues, IIssueDisplayProperties, TIssueGroupByOptions } from "@plane/types";
//
// import { getGroupByColumns } from "../utils";
import { ListGroup } from "./list-group";

export interface IList {
  groupedProjectIds: TGroupedIssues;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup?: boolean;
}

export const List = observer(function List(props: IList) {
  const { groupedProjectIds, groupBy, displayProperties, showEmptyGroup } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative size-full flex flex-col">
      {groupedProjectIds && (
        <>
          <div
            ref={containerRef}
            className="size-full vertical-scrollbar scrollbar-lg relative overflow-auto vertical-scrollbar-margin-top-md"
          >
            {Object.keys(groupedProjectIds).map((id: string) => (
              <ListGroup
                key={id}
                groupedProjectIds={groupedProjectIds?.[id]}
                groupBy={groupBy}
                group={id}
                displayProperties={displayProperties}
                showEmptyGroup={showEmptyGroup}
                containerRef={containerRef}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
