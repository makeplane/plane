import { FC } from "react";
import { observer } from "mobx-react";
import { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// plane web imports
import { PagesCollapsibleContent } from "./content";
import { PagesCollapsibleTitle } from "./title";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  projectId: string | null | undefined;
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsible: FC<TProps> = observer((props) => {
  const { workspaceSlug, workItemId, disabled, projectId, issueServiceType } = props;
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    pages: { getPagesByIssueId, pagesMap },
  } = useIssueDetail(issueServiceType);

  // derived values
  const isCollapsibleOpen = openWidgets.includes("pages");
  const issuePages = getPagesByIssueId(workItemId);
  const count = issuePages.length;

  if (!projectId || count === 0) return null;
  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("pages")}
      title={
        <PagesCollapsibleTitle
          issueServiceType={issueServiceType}
          workspaceSlug={workspaceSlug}
          isOpen={isCollapsibleOpen}
          workItemId={workItemId}
          disabled={disabled}
          count={count}
        />
      }
      buttonClassName="w-full"
      className="max-h-fit "
    >
      <PagesCollapsibleContent
        workItemId={workItemId}
        workspaceSlug={workspaceSlug}
        disabled={disabled}
        projectId={projectId}
        data={issuePages.map((pageId) => pagesMap[pageId])}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
