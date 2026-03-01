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

import type { RefObject } from "react";
import { observer } from "mobx-react";
// hooks
import { useAutoScroller } from "@/hooks/use-auto-scroller";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../constants";

type Props = {
  ganttContainerRef: RefObject<HTMLDivElement>;
};
export const TimelineDragHelper = observer(function TimelineDragHelper(props: Props) {
  const { ganttContainerRef } = props;
  const { isDragging } = useTimeLineChartStore();

  useAutoScroller(ganttContainerRef, isDragging, SIDEBAR_WIDTH, HEADER_HEIGHT);
  return <></>;
});
