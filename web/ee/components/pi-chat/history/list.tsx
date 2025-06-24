"use-client";

import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ControlLink } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { TUserThreads } from "@/plane-web/types";
// local-components
import { groupThreadsByDate } from "./helper";

type TProps = {
  activeChatId?: string;
  userThreads: TUserThreads[];
  initPiChat: (chat_id?: string) => void;
};
const HistoryList = observer((props: TProps) => {
  const { userThreads, initPiChat, activeChatId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();

  // group threads by date
  const groupedThreads: Record<string, TUserThreads[]> = groupThreadsByDate(userThreads);

  const handleThreadClick = (chat_id: string) => {
    router.push(`?chat_id=${chat_id}`);
    initPiChat(chat_id);
  };

  return (
    <div className="flex flex-col gap-4 space-y-2 overflow-hidden overflow-y-auto">
      {Object.entries(groupedThreads).map(([key, threads]) => (
        <div key={key} className="flex flex-col gap-1">
          <h2 className="text-xs text-custom-text-400 font-medium capitalize">
            {["today", "yesterday"].includes(key) ? key : renderFormattedDate(key)}
          </h2>

          <div className="flex flex-col space-y-2">
            {threads && threads.length > 0 ? (
              uniqBy(threads, "chat_id").map((thread) => (
                <ControlLink
                  key={`${thread.chat_id}-${thread.last_modified}`}
                  href={`/${workspaceSlug}/pi-chat?chat_id=${thread.chat_id}`}
                  onClick={() => handleThreadClick(thread.chat_id)}
                  className={cn(
                    "text-sm font-medium p-2 text-custom-text-300 truncate rounded-lg hover:text-custom-text-200 hover:bg-custom-background-90 pointer",
                    {
                      "hover:bg-custom-primary-100/10 !text-custom-primary-100": activeChatId === thread.chat_id,
                    }
                  )}
                >
                  {thread.title || "Untitled"}
                </ControlLink>
              ))
            ) : (
              <div className="text-xs text-custom-text-400">No threads available</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
export default HistoryList;
