import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// Plane-web
import { TInitiativeComment } from "@/plane-web/types/initiative";

type TInitiativeCommentBlock = {
  comment: TInitiativeComment;
  ends: "top" | "bottom" | undefined;
  quickActions: ReactNode;
  children: ReactNode;
};

export const IssueCommentBlock: FC<TInitiativeCommentBlock> = observer((props) => {
  const { comment, ends, quickActions, children } = props;

  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(comment?.actor);
  if (!comment || !userDetails) return <></>;

  return (
    <div className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}>
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div className="flex-shrink-0 relative w-7 h-7 rounded-full flex justify-center items-center z-[3] bg-gray-500 text-white border border-white uppercase font-medium">
        {userDetails.avatar_url && userDetails.avatar_url !== "" ? (
          <img
            src={getFileURL(userDetails.avatar_url)}
            alt={userDetails.is_bot ? userDetails.first_name + " Bot" : userDetails.display_name}
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-custom-border-200"
          />
        ) : (
          <>{userDetails.is_bot ? userDetails.first_name.charAt(0) : userDetails.display_name.charAt(0)}</>
        )}
        <div className="absolute top-2 left-4 w-5 h-5 rounded-full overflow-hidden flex justify-center items-center bg-custom-background-80">
          <MessageCircle className="w-3 h-3 text-custom-text-200" />
        </div>
      </div>
      <div className="w-full truncate relative flex ">
        <div className="w-full truncate space-y-1">
          <div>
            <div className="text-xs capitalize">
              {userDetails.is_bot ? userDetails.first_name + " Bot" : userDetails.display_name}
            </div>
            <div className="text-xs text-custom-text-200">commented {calculateTimeAgo(comment.created_at)}</div>
          </div>
          <div>{children}</div>
        </div>
        <div className="flex-shrink-0 ">{quickActions}</div>
      </div>
    </div>
  );
});
