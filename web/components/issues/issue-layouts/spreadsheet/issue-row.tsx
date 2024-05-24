import { Dispatch, MouseEvent, MutableRefObject, SetStateAction, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { IIssueDisplayProperties, TIssue } from "@plane/types";
// ui
import { ControlLink, Tooltip } from "@plane/ui";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
// local components
import { TRenderQuickActions } from "../list/list-view-types";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { IssueColumn } from "./issue-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
  issueIds: string[];
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  spacingLeft?: number;
}

export const SpreadsheetIssueRow = observer((props: Props) => {
  const {
    displayProperties,
    issueId,
    isEstimateEnabled,
    nestingLevel,
    portalElement,
    updateIssue,
    quickActions,
    canEditProperties,
    isScrolled,
    containerRef,
    issueIds,
    spreadsheetColumnsList,
    spacingLeft = 6,
  } = props;

  const [isExpanded, setExpanded] = useState<boolean>(false);
  const { subIssues: subIssuesStore } = useIssueDetail();

  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {/* first column/ issue name and key column */}
      <RenderIfVisible
        as="tr"
        defaultHeight="calc(2.75rem - 1px)"
        root={containerRef}
        placeholderChildren={<td colSpan={100} className="border-b-[0.5px] border-custom-border-200" />}
      >
        <IssueRowDetails
          issueId={issueId}
          displayProperties={displayProperties}
          quickActions={quickActions}
          canEditProperties={canEditProperties}
          nestingLevel={nestingLevel}
          spacingLeft={spacingLeft}
          isEstimateEnabled={isEstimateEnabled}
          updateIssue={updateIssue}
          portalElement={portalElement}
          isScrolled={isScrolled}
          isExpanded={isExpanded}
          setExpanded={setExpanded}
          spreadsheetColumnsList={spreadsheetColumnsList}
        />
      </RenderIfVisible>

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
            spacingLeft={spacingLeft + (displayProperties.key ? 12 : 28)}
            isEstimateEnabled={isEstimateEnabled}
            updateIssue={updateIssue}
            portalElement={portalElement}
            isScrolled={isScrolled}
            containerRef={containerRef}
            issueIds={issueIds}
            spreadsheetColumnsList={spreadsheetColumnsList}
          />
        ))}
    </>
  );
});

interface IssueRowDetailsProps {
  displayProperties: IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  isExpanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  spacingLeft?: number;
}

const IssueRowDetails = observer((props: IssueRowDetailsProps) => {
  const {
    displayProperties,
    issueId,
    isEstimateEnabled,
    nestingLevel,
    portalElement,
    updateIssue,
    quickActions,
    canEditProperties,
    isScrolled,
    isExpanded,
    setExpanded,
    spreadsheetColumnsList,
    spacingLeft = 6,
  } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const cellRef = useRef(null);
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // hooks
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, peekIssue, setPeekIssue } = useIssueDetail();
  const { isMobile } = usePlatformOS();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({
      workspaceSlug: workspaceSlug.toString(),
      projectId: issue.project_id,
      issueId: issue.id,
      nestingLevel: nestingLevel,
    });

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);

  const paddingLeft = `${spacingLeft}px`;

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`flex items-center h-full w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );
  if (!issueDetail) return null;

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (nestingLevel >= 3) {
      handleIssuePeekOverview(issueDetail);
    } else {
      setExpanded((prevState) => {
        if (!prevState && workspaceSlug && issueDetail)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issueDetail.project_id, issueDetail.id);
        return !prevState;
      });
    }
  };

  const disableUserActions = !canEditProperties(issueDetail.project_id);
  const subIssuesCount = issueDetail?.sub_issues_count ?? 0;

  return (
    <>
      <td id={`issue-${issueId}`} ref={cellRef} tabIndex={0} className="sticky left-0 z-10">
        <ControlLink
          href={`/${workspaceSlug}/projects/${issueDetail.project_id}/issues/${issueId}`}
          target="_blank"
          onClick={() => handleIssuePeekOverview(issueDetail)}
          className={cn(
            "group clickable cursor-pointer h-11 w-[28rem] flex items-center bg-custom-background-100 text-sm after:absolute border-r-[0.5px] z-10 border-custom-border-200",
            {
              "border-b-[0.5px]": !getIsIssuePeeked(issueDetail.id),
              "border border-custom-primary-70 hover:border-custom-primary-70":
                getIsIssuePeeked(issueDetail.id) && nestingLevel === peekIssue?.nestingLevel,
              "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
            }
          )}
          disabled={!!issueDetail?.tempId}
        >
          <div
            className="flex min-w-min items-center gap-0.5 px-4 py-2.5 pl-1.5 pr-0"
            style={nestingLevel !== 0 ? { paddingLeft } : {}}
          >
            <div className="flex items-center">
              {/* bulk ops */}
              <span className="size-3.5" />
              <div className="flex size-4 items-center justify-center">
                {subIssuesCount > 0 && (
                  <button
                    className="flex items-center justify-center size-4 cursor-pointer rounded-sm text-custom-text-400 hover:text-custom-text-300"
                    onClick={handleToggleExpand}
                  >
                    <ChevronRight className={`size-4 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>
            </div>

            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
              <div className="relative flex cursor-pointer items-center text-center text-xs hover:text-custom-text-100">
                <p className={`flex items-center justify-center font-medium leading-7`}>
                  {getProjectIdentifierById(issueDetail.project_id)}-{issueDetail.sequence_id}
                </p>
              </div>
            </WithDisplayPropertiesHOC>
          </div>

          <div className="flex items-center gap-2 justify-between h-full w-full pr-4 truncate">
            <div className="w-full line-clamp-1 text-sm text-custom-text-100">
              <div className="w-full overflow-hidden">
                <Tooltip tooltipContent={issueDetail.name} isMobile={isMobile}>
                  <div
                    className="h-full w-full cursor-pointer truncate px-4 text-left text-[0.825rem] text-custom-text-100 focus:outline-none"
                    tabIndex={-1}
                  >
                    {issueDetail.name}
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={`hidden group-hover:block ${isMenuActive ? "!block" : ""}`}>
              {quickActions({
                issue: issueDetail,
                parentRef: cellRef,
                customActionButton,
                portalElement: portalElement.current,
              })}
            </div>
          </div>
        </ControlLink>
      </td>
      {/* Rest of the columns */}
      {spreadsheetColumnsList.map((property) => (
        <IssueColumn
          key={property}
          displayProperties={displayProperties}
          issueDetail={issueDetail}
          disableUserActions={disableUserActions}
          property={property}
          updateIssue={updateIssue}
          isEstimateEnabled={isEstimateEnabled}
        />
      ))}
    </>
  );
});
