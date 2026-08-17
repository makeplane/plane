/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

export function TesthubPageLoader() {
  return (
    <Loader className="space-y-3 px-page-x py-4">
      <Loader.Item height="36px" width="40%" />
      <Loader.Item height="72px" width="100%" />
      <Loader.Item height="72px" width="100%" />
      <Loader.Item height="72px" width="80%" />
    </Loader>
  );
}

export function TesthubPageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto px-page-x py-4", className)}>
      {children}
    </div>
  );
}

export function TesthubSplitBody({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 w-full flex-col overflow-hidden md:flex-row">{children}</div>;
}

export function TesthubSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-14 font-medium text-primary">{children}</h2>;
}
