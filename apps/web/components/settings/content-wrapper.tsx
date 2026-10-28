/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  hugging?: boolean;
};

export function SettingsContentWrapper(props: Props) {
  const { children, header, hugging = false } = props;

  return (
    <div className="@container flex size-full grow flex-col overflow-hidden">
      {header && (
        <div className="w-full shrink-0">
          <AppHeader header={header} />
        </div>
      )}
      {/* `inset` keeps the scrollbar track reserved so content does not shift when it stops overflowing. */}
      <ScrollArea orientation="vertical" variant="inset" size="sm">
        <div
          className={cn("py-9", {
            "w-full px-page-x lg:px-12": hugging,
            "mx-auto w-full max-w-200 px-page-x @min-[52.7rem]:px-0": !hugging, // 52.7rem = max-width(50rem) + padding-x(1.35rem * 2)
          })}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
