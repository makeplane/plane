/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// components
import { ProIcon } from "@/components/common/pro-icon";

export function IssueEmbedUpgradeCard(props: any) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-5 rounded-md border-[0.5px] border-subtle bg-layer-1 px-5 py-2 shadow-raised-100 max-md:flex-wrap",
        {
          "border-2": props.selected,
        }
      )}
    >
      <div className="flex items-center gap-4">
        <ProIcon className="size-4 flex-shrink-0" />
        <p className="!text-14 text-secondary">
          Embed and access issues in pages seamlessly, upgrade to Plane Pro now.
        </p>
      </div>
      <a
        href="https://plane.so/pro"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(getButtonStyling("primary", "base"), "no-underline")}
      >
        Upgrade
      </a>
    </div>
  );
}
