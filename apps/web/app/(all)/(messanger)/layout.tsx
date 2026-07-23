/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";

export default function MessangerLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas">
      <Outlet />
    </div>
  );
}
