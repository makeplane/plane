import { FC } from "react";
import { observer } from "mobx-react-lite";
// computed
import { IssueLinkDetail } from "./link-detail";
// hooks
import { useIssueDetail, useUser } from "hooks/store";
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TIssueLinkList = {
  linkOperations: TLinkOperationsModal;
};

export const IssueLinkList: FC<TIssueLinkList> = observer((props) => {
  // props
  const { linkOperations } = props;
  // hooks
  const {
    link: { issueLinks },
  } = useIssueDetail();
  const {
    membership: { currentProjectRole },
  } = useUser();

  return (
    <div className="space-y-2">
      {issueLinks &&
        issueLinks.length > 0 &&
        issueLinks.map((linkId) => (
          <IssueLinkDetail
            linkId={linkId}
            linkOperations={linkOperations}
            isNotAllowed={currentProjectRole === 5 || currentProjectRole === 10}
          />
        ))}
    </div>
  );
});
