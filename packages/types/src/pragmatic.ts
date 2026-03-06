/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TDropTarget = {
  element: Element;
  data: Record<string | symbol, unknown>;
};

export type TDropTargetMiscellaneousData = {
  dropEffect: string;
  isActiveDueToStickiness: boolean;
};

export interface IPragmaticPayloadLocation {
  initial: {
    dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
  };
  current: {
    dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
  };
  previous: {
    dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
  };
}

export interface IPragmaticDropPayload {
  location: IPragmaticPayloadLocation;
  source: TDropTarget;
  self: TDropTarget & TDropTargetMiscellaneousData;
}

export type InstructionType = "reparent" | "reorder-above" | "reorder-below" | "make-child" | "instruction-blocked";
