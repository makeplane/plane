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
// plane imports
import { useParams } from "next/navigation";
import { Loader } from "@plane/ui";
// hooks
// plane-web
import type { TUserThreads } from "@/types";
import { SidebarItem } from "./sidebar-item";

type TProps = {
  userThreads: TUserThreads[];
  isProjectLevel?: boolean;
  isLoading?: boolean;
  isFullScreen: boolean;
  activeChatId: string;
  onClickItem: () => void;
};
const RecentChats = observer(function RecentChats(props: TProps) {
  const {
    userThreads,
    isProjectLevel = false,
    isLoading = false,
    isFullScreen = false,
    activeChatId,
    onClickItem,
  } = props;
  const { workspaceSlug, chatId } = useParams();

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-body-xs-semibold text-placeholder">Recents</div>
      <div className="flex flex-col gap-0.5">
        {isLoading ? (
          <Loader className="mx-auto w-full flex flex-col gap-1">
            <Loader.Item width="100%" height="32px" />
            <Loader.Item width="100%" height="32px" />
            <Loader.Item width="100%" height="32px" />
          </Loader>
        ) : userThreads && userThreads.length > 0 ? (
          uniqBy(userThreads, "chat_id").map((thread) => (
            <SidebarItem
              key={thread.chat_id}
              isActive={chatId === thread.chat_id || activeChatId === thread.chat_id}
              chatId={thread.chat_id}
              title={thread.title}
              workspaceSlug={workspaceSlug?.toString() || ""}
              isProjectLevel={isProjectLevel}
              isFavorite={thread.is_favorite}
              isFullScreen={isFullScreen}
              onClickItem={onClickItem}
            />
          ))
        ) : (
          <div className="text-placeholder text-13">No threads available</div>
        )}
      </div>
    </div>
  );
});
export default RecentChats;
