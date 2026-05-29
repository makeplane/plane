import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// computed
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { IssueLinkItem } from "./link-item";
import type { TLinkOperations } from "./root";

type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

type TLinkList = {
  issueId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const LinkList = observer(function LinkList(props: TLinkList) {
  // props
  const { issueId, linkOperations, disabled = false, issueServiceType } = props;
  // hooks
  const {
    link: { getLinksByIssueId },
  } = useIssueDetail(issueServiceType);

  const issueLinks = getLinksByIssueId(issueId);

  if (!issueLinks) return null;

  return (
    <div className="flex flex-col gap-2 pt-4">
      {issueLinks.map((linkId) => (
        <IssueLinkItem
          key={linkId}
          linkId={linkId}
          linkOperations={linkOperations}
          isNotAllowed={disabled}
          issueServiceType={issueServiceType}
        />
      ))}
    </div>
  );
});
