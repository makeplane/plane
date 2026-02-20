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

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Tooltip } from "@plane/propel/tooltip";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  href: string;
  title: string;
  icon: React.ReactNode;
};

export const FavoriteItemTitle = observer(function FavoriteItemTitle(props: Props) {
  const { href, title, icon } = props;
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const handleOnClick = () => {
    if (isMobile) toggleSidebar();
  };

  return (
    <Tooltip tooltipContent={title} isMobile={isMobile} position="right" className="ml-8">
      <Link
        href={href}
        className="flex-grow flex items-center gap-1.5 text-left select-none w-full"
        draggable
        onClick={handleOnClick}
      >
        <span className="flex items-center justify-center text-secondary size-5">{icon}</span>
        <span className="text-13 font-medium text-secondary truncate">{title}</span>
      </Link>
    </Tooltip>
  );
});
