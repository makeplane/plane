"use-client";

import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { ChatIcon, Loader } from "@plane/ui";
import { cn, joinUrlPath } from "@plane/utils";
// hooks
// plane-web
import { TUserThreads } from "@/plane-web/types";

type TProps = {
  userThreads: TUserThreads[];
  isProjectLevel?: boolean;
  isLoading?: boolean;
};
const RecentChats = observer((props: TProps) => {
  const { userThreads, isProjectLevel = false, isLoading = false } = props;
  // router
  const { workspaceSlug, chatId } = useParams();

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-sm font-semibold text-custom-text-300">Recents</div>
      <div className="flex flex-col space-y-2">
        {userThreads && userThreads.length > 0 ? (
          uniqBy(userThreads, "chat_id").map((thread) => (
            <Link
              key={`${thread.chat_id}-${thread.last_modified}`}
              href={joinUrlPath(
                workspaceSlug?.toString() || "",
                isProjectLevel ? "projects" : "",
                "pi-chat",
                thread.chat_id
              )}
              className={cn(
                "flex text-sm font-medium p-2 text-custom-text-200 truncate rounded-lg hover:text-custom-text-200 hover:bg-custom-background-90 pointer items-center gap-2",
                {
                  "hover:bg-custom-primary-100/10 bg-custom-primary-100/10 !text-custom-primary-200":
                    chatId === thread.chat_id,
                }
              )}
            >
              <ChatIcon
                className={cn("text-custom-text-400 flex-shrink-0", {
                  "text-custom-primary-200": chatId === thread.chat_id,
                })}
              />
              <div className="truncate"> {thread.title || "No title"}</div>
            </Link>
          ))
        ) : isLoading ? (
          <Loader className="mx-auto w-full flex flex-col gap-2">
            <Loader.Item width="100%" height="32px" />
            <Loader.Item width="100%" height="32px" />
            <Loader.Item width="100%" height="32px" />
          </Loader>
        ) : (
          <div className="text-custom-text-400 text-sm">No threads available</div>
        )}
      </div>
    </div>
  );
});
export default RecentChats;
