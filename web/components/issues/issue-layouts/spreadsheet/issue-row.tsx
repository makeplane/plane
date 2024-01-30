import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// icons
import { ChevronRight, MoreHorizontal } from "lucide-react";
// constants
import { SPREADSHEET_PROPERTY_DETAILS, SPREADSHEET_PROPERTY_LIST } from "constants/spreadsheet";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
// ui
import { ControlLink, Tooltip } from "@plane/ui";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import { useIssueDetail, useProject } from "hooks/store";
// helper
import { cn } from "helpers/common.helper";
// types
import { IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueActions } from "../types";

interface Props {
  displayProperties: IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  quickActions: (
    issue: TIssue,
    customActionButton?: React.ReactElement,
    portalElement?: HTMLDivElement | null
  ) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  issueId: string;
}

export const SpreadsheetIssueRow = observer((props: Props) => {
  const {
    displayProperties,
    issueId,
    isEstimateEnabled,
    nestingLevel,
    portalElement,
    handleIssues,
    quickActions,
    canEditProperties,
  } = props;

  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  //hooks
  const { getProjectById } = useProject();
  const { peekIssue, setPeekIssue } = useIssueDetail();
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isExpanded, setExpanded] = useState<boolean>(false);

  const menuActionRef = useRef<HTMLDivElement | null>(null);

  const handleIssuePeekOverview = (issue: TIssue) => {
    if (workspaceSlug && issue && issue.project_id && issue.id)
      setPeekIssue({ workspaceSlug: workspaceSlug.toString(), projectId: issue.project_id, issueId: issue.id });
  };

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  const paddingLeft = `${nestingLevel * 54}px`;

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const handleToggleExpand = () => {
    setExpanded((prevState) => {
      if (!prevState && workspaceSlug && issueDetail)
        subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issueDetail.project_id, issueDetail.id);
      return !prevState;
    });
  };

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

  if (!issueDetail) return null;

  const disableUserActions = !canEditProperties(issueDetail.project_id);

  return (
    <>
      <tr
        className={cn({
          "border border-custom-primary-70 hover:border-custom-primary-70": peekIssue?.issueId === issueDetail.id,
        })}
      >
        {/* first column/ issue name and key column */}
        <td
          className={cn(
            "sticky group left-0 h-11  w-[28rem] flex items-center bg-custom-background-100 text-sm after:absolute border-r-[0.5px] border-custom-border-200",
            {
              "border-b-[0.5px]": peekIssue?.issueId !== issueDetail.id,
            }
          )}
        >
          <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
            <div
              className="flex min-w-min items-center gap-1.5 px-4 py-2.5 pr-0"
              style={issueDetail.parent_id && nestingLevel !== 0 ? { paddingLeft } : {}}
            >
              <div className="relative flex cursor-pointer items-center text-center text-xs hover:text-custom-text-100">
                <span
                  className={`flex items-center justify-center font-medium  group-hover:opacity-0 ${
                    isMenuActive ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {getProjectById(issueDetail.project_id)?.identifier}-{issueDetail.sequence_id}
                </span>

                {canEditProperties(issueDetail.project_id) && (
                  <div className={`absolute left-2.5 top-0 hidden group-hover:block ${isMenuActive ? "!block" : ""}`}>
                    {quickActions(issueDetail, customActionButton, portalElement.current)}
                  </div>
                )}
              </div>

              {issueDetail.sub_issues_count > 0 && (
                <div className="flex h-6 w-6 items-center justify-center">
                  <button
                    className="h-5 w-5 cursor-pointer rounded-sm hover:bg-custom-background-90 hover:text-custom-text-100"
                    onClick={() => handleToggleExpand()}
                  >
                    <ChevronRight className={`h-3.5 w-3.5 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                </div>
              )}
            </div>
          </WithDisplayPropertiesHOC>
          <ControlLink
            href={`/${workspaceSlug}/projects/${issueDetail.project_id}/issues/${issueId}`}
            target="_blank"
            onClick={() => handleIssuePeekOverview(issueDetail)}
            className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
          >
            <div className="w-full overflow-hidden">
              <Tooltip tooltipHeading="Title" tooltipContent={issueDetail.name}>
                <div className="h-full w-full cursor-pointer truncate px-4 py-2.5 text-left text-[0.825rem] text-custom-text-100">
                  {issueDetail.name}
                </div>
              </Tooltip>
            </div>
          </ControlLink>
        </td>
        {/* Rest of the columns */}
        {SPREADSHEET_PROPERTY_LIST.map((property) => {
          const { Column } = SPREADSHEET_PROPERTY_DETAILS[property];

          const shouldRenderProperty = property === "estimate" ? isEstimateEnabled : true;

          return (
            <WithDisplayPropertiesHOC
              displayProperties={displayProperties}
              displayPropertyKey={property}
              shouldRenderProperty={shouldRenderProperty}
            >
              <td className="h-11 w-full min-w-[8rem] bg-custom-background-100 text-sm after:absolute after:w-full after:bottom-[-1px] after:border after:border-custom-border-100 border-r-[1px] border-custom-border-100">
                <Column
                  issue={issueDetail}
                  onChange={(issue: TIssue, data: Partial<TIssue>) =>
                    handleIssues({ ...issue, ...data }, EIssueActions.UPDATE)
                  }
                  disabled={disableUserActions}
                />
              </td>
            </WithDisplayPropertiesHOC>
          );
        })}
      </tr>

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <SpreadsheetIssueRow
            key={subIssueId}
            issueId={subIssueId}
            displayProperties={displayProperties}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            nestingLevel={nestingLevel + 1}
            isEstimateEnabled={isEstimateEnabled}
            handleIssues={handleIssues}
            portalElement={portalElement}
          />
        ))}
    </>
  );
});
