"use-client";

import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { TUserThreads } from "@/plane-web/types";
import { SidebarItem } from "./sidebar-item";

type TProps = {
  favoriteChats: TUserThreads[];
  isProjectLevel?: boolean;
  isLoading?: boolean;
};
const FavoriteChats = observer((props: TProps) => {
  const { favoriteChats, isProjectLevel = false } = props;
  // router
  const { workspaceSlug } = useParams();

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-sm font-semibold text-custom-text-300">Favorites</div>
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
          />
        ))}
      </div>
    </div>
  );
});
export default FavoriteChats;
