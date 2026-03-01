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
// components
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import { TimeLineTypeContext } from "@/components/timeline/contexts";
// local imports
import { WorkspaceTimelineChart } from "./chart";

type Props = {
  isLoading?: boolean;
  workspaceSlug: string;
  globalViewId: string;
};

export const WorkspaceTimelineRoot = observer(function WorkspaceTimelineRoot(props: Props) {
  const { workspaceSlug, globalViewId } = props;

  return (
    <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
      <WorkspaceTimelineChart workspaceSlug={workspaceSlug} globalViewId={globalViewId} />
    </TimeLineTypeContext.Provider>
  );
});
