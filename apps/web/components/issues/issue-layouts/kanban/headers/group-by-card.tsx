/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { AddOutline, ArrowCollapseOutline, ArrowExpandOutline, CircleOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import type { TIssue, ISearchIssueResponse, TIssueKanbanFilters, TIssueGroupByOptions } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// ui
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
// constants
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { CreateUpdateEpicModal } from "@/components/epic-modal";

interface IHeaderGroupByCard {
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  column_id: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  collapsedGroups: TIssueKanbanFilters;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  issuePayload: Partial<TIssue>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isEpic?: boolean;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const {
    sub_group_by,
    column_id,
    icon,
    title,
    count,
    collapsedGroups,
    handleCollapsedGroups,
    issuePayload,
    disableIssueCreation,
    addIssuesToView,
    isEpic = false,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  const isCollapsed = !!collapsedGroups?.group_by.includes(column_id);
  // states
  const [isOpen, setIsOpen] = React.useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);
  // hooks
  const storeType = useIssueStoreType();
  // router
  const { workspaceSlug, projectId, moduleId, cycleId } = useParams();

  const renderExistingIssueModal = moduleId || cycleId;
  const ExistingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    try {
      await addIssuesToView?.(issues);

      setToast({
        type: "success",
        title: "Success!",
        message: "Work items added to the cycle successfully.",
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Selected work items could not be added to the cycle. Please try again.",
      });
    }
  };

  // Collapsed: visuals only, inside the column's expand button (KanbanCollapsedColumnTrigger). The flat board
  // stacks the icon, a vertical name and the count; a swimlane header cell only fits the icon and the glyph.
  if (isCollapsed)
    return (
      <span className={cn("flex shrink-0 items-center gap-1", !sub_group_by && "flex-col")}>
        <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {icon ? icon : <CircleOutline width={16} height={16} />}
        </span>
        {!sub_group_by && (
          <>
            <span className="max-h-100 vertical-lr truncate text-body-sm-medium text-primary">{title}</span>
            <span className="pr-0.5 text-body-xs-medium text-tertiary">{count || 0}</span>
          </>
        )}
        <ArrowExpandOutline className="size-3 shrink-0 text-secondary" />
      </span>
    );

  return (
    <>
      {isEpic ? (
        <CreateUpdateEpicModal isOpen={isOpen} onClose={() => setIsOpen(false)} data={issuePayload} />
      ) : (
        <CreateUpdateIssueModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data={issuePayload}
          storeType={storeType}
        />
      )}

      {renderExistingIssueModal && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug?.toString()}
          projectId={projectId?.toString()}
          isOpen={openExistingIssueListModal}
          handleClose={() => setOpenExistingIssueListModal(false)}
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
        />
      )}
      <div className="relative flex w-full flex-shrink-0 flex-row items-center gap-1">
        <div className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {icon ? icon : <CircleOutline width={16} height={16} />}
        </div>

        <div className="relative flex w-full flex-row items-baseline gap-1 overflow-hidden">
          <div className="line-clamp-1 inline-block truncate overflow-hidden text-body-sm-medium text-primary">
            {title}
          </div>
          <div className="flex-shrink-0 pl-2 text-body-xs-medium text-tertiary">{count || 0}</div>
        </div>

        <IconButton
          variant="ghost"
          size="xs"
          aria-label={t("aria_labels.project_board.collapse_group")}
          aria-expanded
          icon={<ArrowCollapseOutline className="size-3.5" />}
          onClick={() => handleCollapsedGroups("group_by", column_id)}
        />

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <Menu>
              <MenuTrigger
                render={
                  <IconButton
                    variant="ghost"
                    size="xs"
                    aria-label={t("common.add")}
                    icon={<AddOutline className="size-3.5" />}
                  />
                }
              />
              <MenuContent side="bottom" align="end">
                <MenuItem
                  label="Create work item"
                  onClick={() => {
                    setIsOpen(true);
                  }}
                />
                <MenuItem
                  label="Add an existing work item"
                  onClick={() => {
                    setOpenExistingIssueListModal(true);
                  }}
                />
              </MenuContent>
            </Menu>
          ) : (
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t("common.add")}
              icon={<AddOutline className="size-3.5" />}
              onClick={() => {
                setIsOpen(true);
              }}
            />
          ))}
      </div>
    </>
  );
});
