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

import { Suspense } from "react";
import { observer } from "mobx-react";
// plane imports
import { ScrollArea } from "@plane/propel/scrollarea";
import type { TProfileSettingsTabs } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { PROFILE_SETTINGS_PAGES_MAP } from "./pages";

type Props = {
  activeTab: TProfileSettingsTabs;
  className?: string;
};

export const ProfileSettingsContent = observer(function ProfileSettingsContent(props: Props) {
  const { activeTab, className } = props;
  const PageComponent = PROFILE_SETTINGS_PAGES_MAP[activeTab];

  return (
    <ScrollArea
      className={cn("shrink-0 bg-surface-1 overflow-y-scroll", className)}
      viewportClassName="px-8 py-9"
      scrollType="hover"
      orientation="vertical"
      size="sm"
    >
      <Suspense>
        <PageComponent />
      </Suspense>
    </ScrollArea>
  );
});
