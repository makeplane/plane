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

import { memo, useCallback } from "react";
import { Button } from "@plane/propel/button";
import { ExternalLinkIcon } from "@plane/propel/icons";
import { PLANE_COMPARE_PAGES } from "../constant";
import type { TPlaneComparePage } from "../constant";
import { WidgetWrapper } from "../widget-wrapper";

export const ComparePlaneView = memo(() => {
  const handleCompareClick = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <WidgetWrapper
      title="Discover why teams switch to Plane"
      subtitle="Compare Plane with the tools you use today and see the difference."
    >
      <div
        className="flex flex-wrap gap-4 rounded-xl bg-layer-2 border border-subtle p-4 w-full shadow-raised-100"
        role="list"
        aria-label="Compare Plane with other tools"
      >
        {PLANE_COMPARE_PAGES.map((page: TPlaneComparePage) => (
          <Button
            key={page.title}
            variant="secondary"
            size="lg"
            onClick={() => handleCompareClick(page.href)}
            aria-label={`Compare Plane with ${page.title}`}
          >
            <page.icon className="size-4" aria-hidden="true" />
            <span>Compare with {page.title}</span>
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </Button>
        ))}
      </div>
    </WidgetWrapper>
  );
});
ComparePlaneView.displayName = "ComparePlaneView";
