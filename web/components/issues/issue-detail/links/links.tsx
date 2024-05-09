import { FC } from "react";
import { observer } from "mobx-react";
// computed
import { useIssueDetail, useUser } from "@/hooks/store";
import { IssueLinkDetail } from "./link-detail";
// hooks
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TIssueLinkList = {
  issueId: string;
  linkOperations: TLinkOperationsModal;
};

export const IssueLinkList: FC<TIssueLinkList> = observer((props) => {
  // props
  const { issueId, linkOperations } = props;
  // hooks
  const {
    link: { getLinksByIssueId },
  } = useIssueDetail();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const issueLinks = getLinksByIssueId(issueId);

  if (!issueLinks) return <></>;

  return (
    <div className="space-y-2">
      {issueLinks &&
        issueLinks.length > 0 &&
        issueLinks.map((linkId) => (
          <IssueLinkDetail
            key={linkId}
            linkId={linkId}
            linkOperations={linkOperations}
            isNotAllowed={currentProjectRole === 5 || currentProjectRole === 10}
          />
        ))}
    </div>
  );
});
