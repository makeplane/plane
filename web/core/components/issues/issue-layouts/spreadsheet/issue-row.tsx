"use client";

import { Dispatch, MouseEvent, MutableRefObject, SetStateAction, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, MoreHorizontal } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// types
import { IIssueDisplayProperties, TIssue } from "@plane/types";
// ui
import { ControlLink, Row, Tooltip } from "@plane/ui";
// components
import { MultipleSelectEntityAction } from "@/components/core";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// constants
import { SPREADSHEET_SELECT_GROUP } from "@/constants/spreadsheet";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useIssues, useProject } from "@/hooks/store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
// local components
import { TRenderQuickActions } from "../list/list-view-types";
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
    spreadsheetColumnsList,
    spacingLeft = 6,
    selectionHelpers,
    shouldRenderByDefault,
  } = props;
  // states
  const [isExpanded, setExpanded] = useState<boolean>(false);
  // store hooks
  const { subIssues: subIssuesStore } = useIssueDetail();
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
            className="border-[0.5px] border-transparent border-b-custom-border-200"
            style={{ height: "calc(2.75rem - 1px)" }}
          />
        }
        classNames={cn("bg-custom-background-100 transition-[background-color]", {
          "group selected-issue-row": isIssueSelected,
          "border-[0.5px] border-custom-border-400": isIssueActive,
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
        />
      </RenderIfVisible>

      {isExpanded &&
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
    selectionHelpers,
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
  const { getIsIssuePeeked, peekIssue } = useIssueDetail();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
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
        if (!prevState && workspaceSlug && issueDetail && issueDetail.project_id)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issueDetail.project_id, issueDetail.id);
        return !prevState;
      });
    }
  };

  const disableUserActions = !canEditProperties(issueDetail.project_id ?? undefined);
  const subIssuesCount = issueDetail?.sub_issues_count ?? 0;
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issueDetail.id);

  const canSelectIssues = !disableUserActions && !selectionHelpers.isSelectionDisabled;

  //TODO: add better logic. This is to have a min width for ID/Key based on the length of project identifier
  const keyMinWidth = displayProperties?.key
    ? (getProjectIdentifierById(issueDetail.project_id)?.length ?? 0 + 5) * 7
    : 0;

  return (
    <>
      <td
        id={`issue-${issueId}`}
        ref={cellRef}
        tabIndex={0}
        className="relative md:sticky left-0 z-10 group/list-block bg-custom-background-100"
      >
        <ControlLink
          href={`/${workspaceSlug}/projects/${issueDetail.project_id}/issues/${issueId}`}
          onClick={() => handleIssuePeekOverview(issueDetail)}
          className={cn(
            "group clickable cursor-pointer h-11 w-[28rem] flex items-center text-sm after:absolute border-r-[0.5px] z-10 border-custom-border-200 bg-transparent group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10",
            {
              "border-b-[0.5px]": !getIsIssuePeeked(issueDetail.id),
              "border border-custom-primary-70 hover:border-custom-primary-70":
                getIsIssuePeeked(issueDetail.id) && nestingLevel === peekIssue?.nestingLevel,
              "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
            }
          )}
          disabled={!!issueDetail?.tempId}
        >
          <Row className="flex item-center flex-row w-full">
            <div className="flex items-center gap-0.5 min-w-min py-2.5">
              {/* select checkbox */}
              {projectId && canSelectIssues && (
                <Tooltip
                  tooltipContent={
                    <>
                      Only issues within the current
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

              {(displayProperties?.key || displayProperties?.issue_type) && (
                <div className="relative flex cursor-pointer items-center text-center text-xs hover:text-custom-text-100">
                  <p className={`flex font-medium leading-7`} style={{ minWidth: `${keyMinWidth}px` }}>
                    {issueDetail.project_id && (
                      <IssueIdentifier
                        issueId={issueDetail.id}
                        projectId={issueDetail.project_id}
                        textContainerClassName="text-sm md:text-xs text-custom-text-300"
                        displayProperties={displayProperties}
                      />
                    )}
                  </p>
                </div>
              )}

              {/* sub-issues chevron */}
              <div className="grid place-items-center size-4">
                {subIssuesCount > 0 && (
                  <button
                    type="button"
                    className="grid place-items-center size-4 rounded-sm text-custom-text-400 hover:text-custom-text-300"
                    onClick={handleToggleExpand}
                  >
                    <ChevronRight
                      className={cn("size-4", {
                        "rotate-90": isExpanded,
                      })}
                      strokeWidth={2.5}
                    />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between h-full w-full truncate my-auto">
              <div className="w-full line-clamp-1 text-sm text-custom-text-100">
                <div className="w-full overflow-hidden">
                  <Tooltip tooltipContent={issueDetail.name} isMobile={isMobile}>
                    <div
                      className="h-full w-full cursor-pointer truncate pr-4 text-left text-[0.825rem] text-custom-text-100 focus:outline-none"
                      tabIndex={-1}
                    >
                      {issueDetail.name}
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div
                className={`hidden group-hover:block ${isMenuActive ? "!block" : ""}`}
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
