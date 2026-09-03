/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// plane imports
import { cn } from "@plane/utils";
// local
import { AppProvider } from "./provider";

// Pathless layout route wrapping every route (see app/routes.ts). Providers, the store
// layer, and app chrome live here instead of root.tsx so they stay out of the SPA-mode
// server build — see the note in app/root.tsx.
export default function AppShellLayout() {
  return (
    <AppProvider>
      <div className={cn("relative flex h-screen w-full flex-col overflow-hidden bg-canvas", "desktop-app-container")}>
        <main className="relative h-full w-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}
