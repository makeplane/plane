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

  if (!issueLinks) return null;

  return (
    <div className="flex flex-col gap-2 py-4">
      {issueLinks.map((linkId) => (
        <IssueLinkItem key={linkId} linkId={linkId} linkOperations={linkOperations} isNotAllowed={disabled} />
      ))}
    </div>
  );
});
