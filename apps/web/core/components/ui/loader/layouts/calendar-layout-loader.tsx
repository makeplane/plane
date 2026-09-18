/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
import { getRandomInt } from "../utils";

function CalendarDay() {
  const dataCount = getRandomInt(0, 1);
  const dataBlocks = range(dataCount).map((index) => (
    <span key={index} className="mb-2 h-8 w-full rounded-sm bg-layer-1" />
  ));

  return (
    <div className="flex min-h-[9rem] w-full flex-col">
      <div className="flex w-full items-center justify-end p-2">
        <span className="h-6 w-6 rounded-sm bg-layer-1" />
      </div>
      <div className="flex flex-col gap-2.5 p-2">{dataBlocks}</div>
    </div>
  );
}

export function CalendarLayoutLoader() {
  return (
    <div className="h-full w-full animate-pulse overflow-y-auto bg-surface-1">
      <span className="relative grid grid-cols-5 divide-x-[0.5px] divide-subtle-1 text-13 font-medium">
        {range(5).map((index) => (
          <span key={index} className="h-11 w-full bg-layer-1" />
        ))}
      </span>
      <div className="h-full w-full overflow-y-auto">
        <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-subtle-1 overflow-y-auto">
          {range(6).map((index) => (
            <div key={index} className="grid grid-cols-5 divide-x-[0.5px] divide-subtle-1">
              {range(5).map((index) => (
                <CalendarDay key={index} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
