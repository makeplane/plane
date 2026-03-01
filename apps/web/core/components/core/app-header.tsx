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

import type { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { Row } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ExtendedAppHeader } from "@/components/common/extended-app-header";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
  className?: string;
  rowClassName?: string;
  showToggleButton?: boolean;
}

export const AppHeader = observer(function AppHeader(props: AppHeaderProps) {
  const { header, mobileHeader, className, rowClassName, showToggleButton = true } = props;

  return (
    <div className={cn("z-[18]", className)}>
      <Row className={cn("h-11 flex gap-2 w-full items-center border-b border-subtle bg-surface-1", rowClassName)}>
        <ExtendedAppHeader header={header} showToggleButton={showToggleButton} />
      </Row>
      {mobileHeader && mobileHeader}
    </div>
  );
});
