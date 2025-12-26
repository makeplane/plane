import type { Dispatch, MouseEvent, MutableRefObject, SetStateAction } from "react";
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { SPREADSHEET_SELECT_GROUP } from "@plane/constants";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
import { ChevronRightIcon } from "@plane/propel/icons";
// types
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { ControlLink, Row } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// components
import { MultipleSelectEntityAction } from "@/components/core/multiple-select";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// helper
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local components
import type { TRenderQuickActions } from "../list/list-view-types";
import { isIssueNew } from "../utils";
import { IssueColumn } from "./issue-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  spacingLeft?: number;
  selectionHelpers: TSelectionHelper;
  shouldRenderByDefault?: boolean;
  isEpic?: boolean;
}

export const SpreadsheetIssueRow = observer(function SpreadsheetIssueRow(props: Props) {
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
    spreadsheetColumnsList,
    spacingLeft = 6,
    selectionHelpers,
    shouldRenderByDefault,
    isEpic = false,
  } = props;
  // states
  const [isExpanded, setExpanded] = useState<boolean>(false);
  // store hooks
  const { subIssues: subIssuesStore } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const { issueMap } = useIssues();

  // derived values
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issueId);
  const isIssueActive = selectionHelpers.getIsEntityActive(issueId);

  return (
    <>
      {/* first column/ issue name and key column */}
      <RenderIfVisible
        as="tr"
        root={containerRef}
        placeholderChildren={
          <td
            colSpan={100}
            className="border-[0.5px] border-transparent border-b-subtle-1"
            style={{ height: "calc(2.75rem - 1px)" }}
          />
        }
        classNames={cn("bg-surface-1 transition-[background-color]", {
          "group selected-issue-row": isIssueSelected,
          "border-[0.5px] border-strong-1": isIssueActive,
        })}
        verticalOffset={100}
        shouldRecordHeights={false}
        defaultValue={shouldRenderByDefault || isIssueNew(issueMap[issueId])}
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
          selectionHelpers={selectionHelpers}
          isEpic={isEpic}
        />
      </RenderIfVisible>

      {isExpanded &&
        !isEpic &&
        subIssues?.map((subIssueId: string) => (
          <SpreadsheetIssueRow
            key={subIssueId}
            issueId={subIssueId}
            displayProperties={displayProperties}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            nestingLevel={nestingLevel + 1}
            spacingLeft={spacingLeft + 12}
            isEstimateEnabled={isEstimateEnabled}
            updateIssue={updateIssue}
            portalElement={portalElement}
            isScrolled={isScrolled}
            containerRef={containerRef}
            spreadsheetColumnsList={spreadsheetColumnsList}
            selectionHelpers={selectionHelpers}
            shouldRenderByDefault={isExpanded}
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
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  isExpanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  spacingLeft?: number;
  selectionHelpers: TSelectionHelper;
  isEpic?: boolean;
}

const IssueRowDetails = observer(function IssueRowDetails(props: IssueRowDetailsProps) {
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
    selectionHelpers,
    isEpic = false,
  } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const cellRef = useRef(null);
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, peekIssue } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
  const { isMobile } = usePlatformOS();

  // handlers
  const handleIssuePeekOverview = (issue: TIssue) =>
    handleRedirection(workspaceSlug?.toString(), issue, isMobile, nestingLevel);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);

  const subIssueIndentation = `${spacingLeft}px`;

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`flex items-center h-full w-full cursor-pointer rounded-sm p-1 text-placeholder hover:bg-layer-1 ${
        isMenuActive ? "bg-layer-1 text-primary" : "text-secondary"
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
        if (!prevState && workspaceSlug && issueDetail && issueDetail.project_id)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issueDetail.project_id, issueDetail.id);
        return !prevState;
      });
    }
  };

  const disableUserActions = !canEditProperties(issueDetail.project_id ?? undefined);
  const subIssuesCount = issueDetail?.sub_issues_count ?? 0;
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issueDetail.id);
  const projectIdentifier = getProjectIdentifierById(issueDetail.project_id);

  const canSelectIssues = !disableUserActions && !selectionHelpers.isSelectionDisabled;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issueDetail?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issueDetail?.sequence_id,
    isEpic,
  });

  return (
    <>
      {/* Single sticky column containing both identifier and workitem */}
      <td
        id={`issue-${issueId}`}
        ref={cellRef}
        tabIndex={0}
        className="relative md:sticky left-0 z-10 group/list-block bg-surface-1 max-w-lg"
      >
        <ControlLink
          href={workItemLink}
          onClick={() => handleIssuePeekOverview(issueDetail)}
          className="outline-none"
          disabled={!!issueDetail?.tempId}
        >
          <Row
            className={cn(
              "group clickable cursor-pointer h-11 w-full flex items-center text-13 after:absolute border-r-[0.5px] z-10 border-subtle-1 bg-transparent group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10",
              {
                "border-b-[0.5px]": !getIsIssuePeeked(issueDetail.id),
                "border border-accent-strong hover:border-accent-strong":
                  getIsIssuePeeked(issueDetail.id) && nestingLevel === peekIssue?.nestingLevel,
                "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
              }
            )}
          >
            {/* Identifier section - conditionally rendered */}
            {displayProperties?.key && (
              <div className="flex-shrink-0 flex items-center h-full min-w-24">
                <div className="relative flex cursor-pointer items-center text-11 hover:text-primary">
                  {issueDetail.project_id && (
                    <IssueIdentifier
                      issueId={issueDetail.id}
                      projectId={issueDetail.project_id}
                      size="xs"
                      variant="tertiary"
                      displayProperties={displayProperties}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Workitem section */}
            <div
              className={cn("flex items-center gap-0.5 py-2 flex-grow", {
                "min-w-[360px]": !displayProperties?.key,
                "min-w-60": displayProperties?.key,
              })}
            >
              {/* select checkbox */}
              {projectId && canSelectIssues && (
                <Tooltip
                  tooltipContent={
                    <>
                      Only work items within the current
                      <br />
                      project can be selected.
                    </>
                  }
                  disabled={issueDetail.project_id === projectId}
                >
                  <div className="flex-shrink-0 grid place-items-center w-3.5 mr-1 absolute left-1">
                    <MultipleSelectEntityAction
                      className={cn(
                        "opacity-0 pointer-events-none group-hover/list-block:opacity-100 group-hover/list-block:pointer-events-auto transition-opacity",
                        {
                          "opacity-100 pointer-events-auto": isIssueSelected,
                        }
                      )}
                      groupId={SPREADSHEET_SELECT_GROUP}
                      id={issueDetail.id}
                      selectionHelpers={selectionHelpers}
                      disabled={issueDetail.project_id !== projectId}
                    />
                  </div>
                </Tooltip>
              )}

              {/* sub issues indentation */}
              {nestingLevel !== 0 && <div style={{ width: subIssueIndentation }} />}

              {/* sub-issues chevron */}
              <div className="grid place-items-center size-4">
                {subIssuesCount > 0 && !isEpic && (
                  <button
                    type="button"
                    className="grid place-items-center size-4 rounded-xs text-placeholder hover:text-tertiary"
                    onClick={handleToggleExpand}
                  >
                    <ChevronRightIcon
                      className={cn("size-4", {
                        "rotate-90": isExpanded,
                      })}
                      strokeWidth={2.5}
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 justify-between h-full w-full truncate my-auto">
                <div className="w-full line-clamp-1 text-14 text-primary">
                  <div className="w-full overflow-hidden">
                    <Tooltip tooltipContent={issueDetail.name} isMobile={isMobile}>
                      <div
                        className="h-full w-full cursor-pointer truncate pr-4 text-left text-13 text-primary focus:outline-none"
                        tabIndex={-1}
                      >
                        {issueDetail.name}
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${isMenuActive ? "!opacity-100" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {quickActions({
                    issue: issueDetail,
                    parentRef: cellRef,
                    customActionButton,
                    portalElement: portalElement.current,
                  })}
                </div>
              </div>
            </div>
          </Row>
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
