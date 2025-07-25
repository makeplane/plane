"use-client";

import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { ChatIcon } from "@plane/ui";
import { cn, joinUrlPath } from "@plane/utils";
// hooks
// plane-web
import { TUserThreads } from "@/plane-web/types";

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
      <div className="flex flex-col space-y-2">
        {uniqBy(favoriteChats, "chat_id").map((chat) => (
          <Link
            key={`${chat.chat_id}`}
            href={joinUrlPath(
              workspaceSlug?.toString() || "",
              isProjectLevel ? "projects" : "",
              "pi-chat",
              chat.chat_id
            )}
            className={cn(
              "flex text-sm font-medium p-2 text-custom-text-200 truncate rounded-lg hover:text-custom-text-200 hover:bg-custom-background-90 pointer items-center gap-2"
            )}
          >
            <ChatIcon className={cn("text-custom-text-400 flex-shrink-0")} />
            <div className="truncate"> {chat.title || "No title"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
});
export default FavoriteChats;
