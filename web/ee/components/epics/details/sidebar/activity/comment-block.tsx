import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { TIssueComment } from "@plane/types";
import { Avatar } from "@plane/ui";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";

type TIssueCommentBlock = {
  comment: TIssueComment;
  quickActions: ReactNode;
  children: ReactNode;
};

export const IssueCommentBlock: FC<TIssueCommentBlock> = observer((props) => {
  const { comment, quickActions, children } = props;

  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(comment?.actor);
  if (!comment || !userDetails) return <></>;

  return (
    <div className="flex gap-2 w-full">
      <div className="size-9 grid place-items-center flex-shrink-0">
        <Avatar size="lg" name={userDetails?.display_name} src={userDetails?.avatar_url} className="flex-shrink-0" />
      </div>
      <div className="flex flex-col gap-3 truncate flex-grow">
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
