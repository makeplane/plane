import { FC } from "react";
import { observer } from "mobx-react";
// computed
import { useIssueDetail } from "@/hooks/store";
import { IssueLinkItem } from "./link-item";
// hooks
import { TLinkOperations } from "./root";

type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

type TLinkList = {
  issueId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const LinkList: FC<TLinkList> = observer((props) => {
  // props
  const { issueId, linkOperations, disabled = false } = props;
  // hooks
  const {
    link: { getLinksByIssueId },
  } = useIssueDetail();

  const issueLinks = getLinksByIssueId(issueId);

  if (!issueLinks) return <></>;

  return (
    <div className="grid grid-cols-12 3xl:grid-cols-10 gap-2 px-9 py-4">
      {issueLinks &&
        issueLinks.length > 0 &&
        issueLinks.map((linkId) => (
          <IssueLinkItem key={linkId} linkId={linkId} linkOperations={linkOperations} isNotAllowed={disabled} />
        ))}
    </div>
  );
});