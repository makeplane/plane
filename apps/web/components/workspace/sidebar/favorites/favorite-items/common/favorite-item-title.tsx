/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ListItemLink } from "@makeplane/propel/elements/list";
import { ListItemLabel } from "@makeplane/propel/components/list";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
    <Tooltip label={title} layout="stacked" side="right" sideOffset={40} disabled={isMobile}>
      <ListItemLink render={<Link href={href} draggable onClick={handleOnClick} />}>
        <span className="flex size-4 items-center justify-center">{icon}</span>
        <ListItemLabel>{title}</ListItemLabel>
      </ListItemLink>
    </Tooltip>
  );
});
