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

import type { TipTapMark, MarkRendererRegistry } from "./types";

export function applyMarks<TState, TCtx = void>(
  marks: TipTapMark[] | undefined,
  baseState: TState,
  registry: MarkRendererRegistry<TState, TCtx>,
  ctx?: TCtx
): TState {
  if (!marks || marks.length === 0) {
    return baseState;
  }

  return marks.reduce((state, mark) => {
    const renderer = registry[mark.type];
    if (renderer) {
      return renderer(mark, state, ctx as TCtx);
    }
    return state;
  }, baseState);
}
