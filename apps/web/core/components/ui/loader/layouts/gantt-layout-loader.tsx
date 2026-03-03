/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
import { Row } from "@plane/ui";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { getRandomLength } from "../utils";

export function GanttLayoutListItemLoader() {
  return (
    <div className="flex w-full items-center gap-4 px-6" style={{ height: `${BLOCK_HEIGHT}px` }}>
      <div className="h-6 w-8 rounded-sm bg-layer-1 px-3" />
      <div className={`h-6 px-3 w-${getRandomLength(["32", "52", "72"])} rounded-sm bg-layer-1`} />
    </div>
  );
}

export function GanttLayoutLoader() {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-x-auto">
      <div className="min-h-10 w-full border-b border-subtle">
        <span className="h-6 w-12 rounded-sm bg-layer-1" />
      </div>
      <div className="flex h-full">
        <div className="h-full w-[25.5rem] border-r border-subtle">
          <Row className="flex h-header items-end border-b border-subtle py-2">
            <div className="flex w-full items-center justify-between">
              <span className="h-5 w-14 rounded-sm bg-layer-1" />
              <span className="h-5 w-16 rounded-sm bg-layer-1" />
            </div>
          </Row>
          <Row className="flex h-11 w-full flex-col gap-3 py-4">
            {range(6).map((index) => (
              <div key={index} className="flex h-11 w-full items-center gap-3">
                <span className="h-6 w-6 rounded-sm bg-layer-1" />
                <span className={`h-6 w-${getRandomLength(["32", "52", "72"])} rounded-sm bg-layer-1`} />
              </div>
            ))}
          </Row>
        </div>
        <div className="h-full w-full border-r border-subtle">
          <div className="flex h-header flex-col justify-between gap-2 border-b border-subtle px-4 py-1.5">
            <div className="flex items-center justify-start">
              <span className="h-5 w-20 rounded-sm bg-layer-1" />
            </div>
            <div className="flex w-full items-center justify-between gap-3">
              {range(15).map((index) => (
                <span key={index} className="h-5 w-10 rounded-sm bg-layer-1" />
              ))}
            </div>
          </div>
          <div className="flex h-11 w-full flex-col gap-3 p-4">
            {range(6).map((index) => (
              <div
                key={index}
                className={`flex h-11 w-full items-center gap-3`}
                style={{ paddingLeft: getRandomLength(["115px", "208px", "260px"]) }}
              >
                <span className={`h-6 w-40 w-${getRandomLength(["32", "52", "72"])} rounded-sm bg-layer-1`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
