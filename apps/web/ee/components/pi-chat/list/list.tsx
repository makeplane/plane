"use-client";

import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
import { TUserThreads } from "@/plane-web/types";
import { PiChatListItem } from "./list-item";
import PiChatListLoader from "./loader";

type TProps = {
  userThreads: TUserThreads[] | undefined;
  isLoading: boolean;
};
const PiChatList = observer((props: TProps) => {
  const { userThreads, isLoading } = props;

  return (
    <div className="flex flex-col space-y-2  overflow-scroll">
      <div className="flex flex-col divide-y divide-custom-border-200">
        {userThreads && userThreads.length > 0 ? (
          uniqBy(userThreads, "chat_id").map((thread) => <PiChatListItem key={thread.chat_id} thread={thread} />)
        ) : isLoading ? (
          <PiChatListLoader />
        ) : (
          <div className="text-custom-text-400 text-sm">No threads available</div>
        )}
      </div>
    </div>
  );
});
export default PiChatList;
