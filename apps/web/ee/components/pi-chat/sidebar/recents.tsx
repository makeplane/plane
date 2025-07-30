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
import { SidebarNavItem } from "@/components/sidebar";

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
      <div className="flex flex-col gap-0.5">
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
              className="py-0.5"
            >
              <SidebarNavItem isActive={chatId === thread.chat_id}>
                <div className="text-sm leading-5 font-medium truncate"> {thread.title || "No title"}</div>
              </SidebarNavItem>
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
