/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet, redirect } from "react-router";
// plane imports
import { cn } from "@plane/utils";
// local
import { ensureTrailingSlash } from "./compat/next/helper";
import { AppProvider } from "./provider";
import type { Route } from "./+types/layout";

const trailingSlashRedirectMiddleware: Route.ClientMiddlewareFunction = async ({ request }, next) => {
  const canonical = ensureTrailingSlash(request.url);
  if (canonical !== request.url) {
    throw redirect(canonical, { status: 308 });
  }
  return next();
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [trailingSlashRedirectMiddleware];

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
