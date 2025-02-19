"use client";

import { useMemo, useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Copy, ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
import { ARCHIVABLE_STATE_GROUPS, EIssuesStoreType, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import { TIssue } from "@plane/types";
// ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveIssueModal, CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { generateWorkItemLink } from "@/helpers/issue.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useProject, useProjectState, useUserPermissions } from "@/hooks/store";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const ProjectIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
  } = props;
  // i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const stateDetails = getStateById(issue.state_id);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  // auth
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      issue.project_id ?? undefined
    ) && !readOnly;
  const isArchivingAllowed = handleArchive && isEditingAllowed;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isDeletingAllowed = isEditingAllowed;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  const handleCopyIssueLink = () =>
    copyUrlToClipboard(workItemLink, false).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Work item link copied to clipboard",
      })
    );
  const handleOpenInNewTab = () => window.open(workItemLink, "_blank");

  const isDraftIssue = pathname?.includes("draft-issues") || false;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: isDraftIssue ? false : issue.is_draft,
      sourceIssueId: issue.id,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = useMemo(
    () => [
      {
        key: "edit",
        title: t("common.actions.edit"),
        icon: Pencil,
        action: () => {
          setTrackElement(activeLayout);
          setIssueToEdit(issue);
          setCreateUpdateIssueModal(true);
        },
        shouldRender: isEditingAllowed,
      },
      {
        key: "make-a-copy",
        title: t("common.actions.make_a_copy"),
        icon: Copy,
        action: () => {
          setTrackElement(activeLayout);
          setCreateUpdateIssueModal(true);
        },
        shouldRender: isEditingAllowed,
      },
      {
        key: "open-in-new-tab",
        title: t("common.actions.open_in_new_tab"),
        icon: ExternalLink,
        action: handleOpenInNewTab,
      },
      {
        key: "copy-link",
        title: t("common.actions.copy_link"),
        icon: Link,
        action: handleCopyIssueLink,
      },
      {
        key: "archive",
        title: t("common.actions.archive"),
        description: isInArchivableGroup ? undefined : t("issue.archive.description"),
        icon: ArchiveIcon,
        className: "items-start",
        iconClassName: "mt-1",
        action: () => setArchiveIssueModal(true),
        disabled: !isInArchivableGroup,
        shouldRender: isArchivingAllowed,
      },
      {
        key: "delete",
        title: t("common.actions.delete"),
        icon: Trash2,
        action: () => {
          setTrackElement(activeLayout);
          setDeleteIssueModal(true);
        },
        shouldRender: isDeletingAllowed,
      },
    ],
    [t]
  );

  return (
    <>
      <ArchiveIssueModal
        data={issue}
        isOpen={archiveIssueModal}
        handleClose={() => setArchiveIssueModal(false)}
        onSubmit={handleArchive}
      />
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
        storeType={EIssuesStoreType.PROJECT}
        isDraft={isDraftIssue}
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        placement={placements}
        customButton={customActionButton}
        portalElement={portalElement}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
