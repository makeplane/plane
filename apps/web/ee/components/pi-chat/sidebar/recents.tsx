"use-client";

import { uniqBy } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { useParams } from "next/navigation";
import { Loader } from "@plane/ui";
// hooks
// plane-web
import { TUserThreads } from "@/plane-web/types";
import { SidebarItem } from "./sidebar-item";

type TProps = {
  userThreads: TUserThreads[];
  isProjectLevel?: boolean;
  isLoading?: boolean;
  isFullScreen: boolean;
  activeChatId: string;
};
const RecentChats = observer((props: TProps) => {
  const { userThreads, isProjectLevel = false, isLoading = false, isFullScreen = false, activeChatId } = props;
  const { workspaceSlug, chatId } = useParams();

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-sm font-semibold text-custom-text-400">Recents</div>
      <div className="flex flex-col gap-0.5">
        {isLoading ? (
          <Loader className="mx-auto w-full flex flex-col gap-2">
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
            />
          ))
        ) : (
          <div className="text-custom-text-400 text-sm">No threads available</div>
        )}
      </div>
    </div>
  );
});
export default RecentChats;
