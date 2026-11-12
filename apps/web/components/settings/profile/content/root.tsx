/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Suspense } from "react";
import { observer } from "mobx-react";
// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import type { TProfileSettingsTabs } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { PROFILE_SETTINGS_PAGES_MAP } from "./pages";

type Props = {
  activeTab: TProfileSettingsTabs;
  className?: string;
  /** Gutter inside the scrolled pane; defaults to the full-page spacing. */
  contentClassName?: string;
};

export const ProfileSettingsContent = observer(function ProfileSettingsContent(props: Props) {
  const { activeTab, className, contentClassName } = props;
  const PageComponent = PROFILE_SETTINGS_PAGES_MAP[activeTab];

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden bg-surface-1", className)}>
      <ScrollArea orientation="vertical">
        <div className={cn("px-4 py-6 sm:px-8 sm:py-9", contentClassName)}>
          <Suspense>
            <PageComponent />
          </Suspense>
        </div>
      </ScrollArea>
    </div>
  );
});
