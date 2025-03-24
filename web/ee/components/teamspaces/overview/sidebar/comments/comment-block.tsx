import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web imports
import { TTeamspaceComment } from "@/plane-web/types";

type TTeamspaceCommentBlock = {
  comment: TTeamspaceComment;
  quickActions: ReactNode;
  children: ReactNode;
};

export const TeamspaceCommentBlock: FC<TTeamspaceCommentBlock> = observer((props) => {
  const { comment, quickActions, children } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(comment?.actor);

  if (!comment || !userDetails) return <></>;
  return (
    <div className="flex gap-2 w-full">
      <div className="size-9 grid place-items-center flex-shrink-0">
        <Avatar
          size="lg"
          name={userDetails?.display_name}
          src={getFileURL(userDetails?.avatar_url)}
          className="flex-shrink-0"
        />
      </div>
      <div className="flex flex-col truncate flex-grow">
        <div className="flex w-full">
          <div className="flex-1">
            <div className="text-sm">
              {userDetails.is_bot ? userDetails.first_name + " Bot" : userDetails.display_name}
            </div>
            <div className="text-xs text-custom-text-350">{renderFormattedDate(comment?.updated_at)}</div>
          </div>
          <div className="flex-shrink-0 ">{quickActions}</div>
        </div>
        <div className="text-base mb-2">{children}</div>
      </div>
    </div>
  );
});
