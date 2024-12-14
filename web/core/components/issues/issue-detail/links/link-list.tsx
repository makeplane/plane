import { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
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
  issueServiceType?: TIssueServiceType;
};

export const LinkList: FC<TLinkList> = observer((props) => {
  // props
  const { issueId, linkOperations, disabled = false, issueServiceType = EIssueServiceType.ISSUES } = props;
  // hooks
  const {
    link: { getLinksByIssueId },
  } = useIssueDetail(issueServiceType);

  const issueLinks = getLinksByIssueId(issueId);

  if (!issueLinks) return null;

  return (
    <div className="flex flex-col gap-2 py-4">
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
