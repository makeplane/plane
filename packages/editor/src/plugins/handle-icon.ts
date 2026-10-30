/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentType, SVGProps } from "react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

export const mountHandleIcon = (container: HTMLElement, icon: ComponentType<SVGProps<SVGSVGElement>>) => {
  const root = createRoot(container);
  root.render(createElement(icon, { width: 14, height: 14 }));

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    // The editor can be destroyed during its containing React tree's commit.
    queueMicrotask(() => root.unmount());
  };
};
