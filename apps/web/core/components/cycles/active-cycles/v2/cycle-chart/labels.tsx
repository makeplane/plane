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

import { startOfToday, format } from "date-fns";
import type { TCycleProgress } from "@plane/types";

const renderScopeLabel = (data: TCycleProgress[], props: any) => {
  const { x, y, value } = props;
  const prevValue = data[props.index - 1]?.scope;
  const today = format(startOfToday(), "yyyy-MM-dd");

  return prevValue && prevValue !== value && data[props.index].date <= today ? (
    <g>
      <text
        x={x - 10}
        y={26}
        dy={-4}
        fill="#003FCC"
        fontSize={10}
        className="font-bold absolute top-0"
        textAnchor="start"
      >
        {prevValue < value ? <>&#9650; </> : <>&#9660; </>}
        {prevValue < value ? "+" : "-"}
        {`${Math.abs(value - prevValue)}`}
      </text>
      <line x1={x} y1={26} x2={x} y2={30} stroke="#003FCC" strokeWidth="1" />
    </g>
  ) : (
    <></>
  );
};

const renderYAxisLabel = (props: any) => {
  const { x, y, value } = props;
  return <text fill={"#003FCC"} fontSize={10} className="font-bold" textAnchor="start" />;
};
export { renderScopeLabel, renderYAxisLabel };
