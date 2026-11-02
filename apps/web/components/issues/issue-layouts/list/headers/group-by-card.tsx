/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AddOutline, CircleDashedOutline } from "@makeplane/propel/icons";
// types
import { setToast } from "@plane/blocks/toast";
import type { TIssue, ISearchIssueResponse, TIssueGroupByOptions } from "@plane/types";
import { useTranslation } from "@plane/i18n";
// ui
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// components
import { cn } from "@plane/utils";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
import { CreateUpdateEpicModal } from "@/components/epic-modal";
// constants
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

interface IHeaderGroupByCard {
  groupID: string;
  groupBy: TIssueGroupByOptions;
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  selectionHelpers: TSelectionHelper;
  handleCollapsedGroups: (value: string) => void;
  isExpanded: boolean;
  isEpic?: boolean;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const {
    groupID,
    icon,
    title,
    count,
    issuePayload,
    canEditProperties,
    disableIssueCreation,
    addIssuesToView,
    selectionHelpers,
    handleCollapsedGroups,
    isExpanded,
    isEpic = false,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);
  // router
  const { workspaceSlug, projectId, moduleId, cycleId } = useParams();
  const storeType = useIssueStoreType();
  // derived values
  const renderExistingIssueModal = moduleId || cycleId;
  const existingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };
  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(groupID) === "empty";
  // auth
  const canSelectIssues = canEditProperties(projectId?.toString()) && !selectionHelpers.isSelectionDisabled;

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

  return (
    <>
      <div className="group/list-header flex w-full flex-shrink-0 items-center gap-2 py-1.5">
        {canSelectIssues && (
          <div className="absolute left-0.5 flex w-4 flex-shrink-0 items-center">
            <MultipleSelectGroupAction
              className={cn(
                "pointer-events-none size-3.5 opacity-0 !outline-none group-focus-within/list-header:pointer-events-auto group-focus-within/list-header:opacity-100 group-hover/list-header:pointer-events-auto group-hover/list-header:opacity-100",
                {
                  "pointer-events-auto opacity-100": !isGroupSelectionEmpty,
                }
              )}
              groupID={groupID}
              selectionHelpers={selectionHelpers}
              disabled={count === 0}
            />
          </div>
        )}
        <div className="grid flex-shrink-0 place-items-center overflow-hidden">
          {icon ?? <CircleDashedOutline className="size-3.5" />}
        </div>

        <button
          type="button"
          aria-label={title}
          aria-expanded={isExpanded}
          className="relative flex w-full min-w-0 cursor-pointer flex-row items-center gap-1 rounded-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
          onClick={() => handleCollapsedGroups(groupID)}
        >
          <span className="line-clamp-1 inline-block truncate text-body-sm-medium text-primary">{title}</span>
          <span className="pl-2 text-body-xs-medium text-tertiary">{count || 0}</span>
          <span className="px-2.5" />
        </button>

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <Menu>
              <MenuTrigger
                render={
                  <IconButton
                    variant="ghost"
                    size="md"
                    aria-label={t("common.add")}
                    icon={<Icon icon={AddOutline} />}
                  />
                }
              />
              <MenuContent side="bottom" align="start">
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
              size="md"
              aria-label={t("common.add")}
              icon={<Icon icon={AddOutline} />}
              onClick={() => {
                setIsOpen(true);
              }}
            />
          ))}

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
            searchParams={existingIssuesListModalPayload}
            handleOnSubmit={handleAddIssuesToView}
          />
        )}
      </div>
    </>
  );
});
