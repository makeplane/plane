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

import { useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import type { Relation } from "@/types";
//
import { DependencyPathModal } from "./dependency-modal";
import { TimelineDependencyPathItem } from "./dependency-path-item";

type Props = {
  isEpic?: boolean;
};

export const TimelineDependencyPaths = observer(function TimelineDependencyPaths(props: Props) {
  const { isEpic = false } = props;
  // state
  const [selectedRelation, setSelectedRelation] = useState<Relation | undefined>();
  // store hooks
  const { isDependencyEnabled, relations } = useTimeLineChartStore();

  if (!isDependencyEnabled) return <></>;

  const handleClose = () => {
    setSelectedRelation(undefined);
  };

  return (
    <>
      <DependencyPathModal relation={selectedRelation} handleClose={handleClose} isEpic={isEpic} />
      <div>
        {relations.map((relation) => (
          <TimelineDependencyPathItem
            key={relation.id}
            relation={relation}
            onPathClick={(relation: Relation) => {
              setSelectedRelation(relation);
            }}
          />
        ))}
      </div>
    </>
  );
});
