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

import { uniqBy } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { TUserThreads } from "@/types";
import { SidebarItem } from "./sidebar-item";

type TProps = {
  favoriteChats: TUserThreads[];
  isProjectLevel?: boolean;
  isFullScreen: boolean;
};
const FavoriteChats = observer(function FavoriteChats(props: TProps) {
  const { favoriteChats, isProjectLevel = false, isFullScreen } = props;
  // router
  const { workspaceSlug } = useParams();

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-13 font-semibold text-tertiary">Favorites</div>
      <div className="flex flex-col gap-0.5">
        {uniqBy(favoriteChats, "chat_id").map((chat) => (
          <SidebarItem
            key={chat.chat_id}
            isActive={false}
            chatId={chat.chat_id}
            title={chat.title}
            workspaceSlug={workspaceSlug?.toString() || ""}
            isProjectLevel={isProjectLevel}
            isFavorite={chat.is_favorite}
            optionToExclude={["rename", "delete"]}
            onClickItem={() => {}}
            isFullScreen={isFullScreen}
          />
        ))}
      </div>
    </div>
  );
});
export default FavoriteChats;
