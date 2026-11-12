/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// ui
import { Button } from "@makeplane/propel/components/button";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// types
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404 - Page Not Found" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  return (
    <div className="h-screen w-full overflow-hidden bg-surface-1 p-4">
      <EmptyStateDetailed
        align="center"
        assetKey="error-404"
        assetClassName="size-40"
        title="Oops! Something went wrong."
        description="Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is temporarily unavailable."
        customButton={
          <Button
            variant="primary"
            size="lg"
            stretch="auto"
            label="Go to Home"
            nativeButton={false}
            render={<Link href="/" />}
          />
        }
      />
    </div>
  );
}

export default PageNotFound;
