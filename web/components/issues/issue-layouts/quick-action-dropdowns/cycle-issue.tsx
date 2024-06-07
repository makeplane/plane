import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Copy, ExternalLink, Link, Pencil, Trash2, XCircle } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveIssueModal, CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { ARCHIVABLE_STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useProjectState, useUser } from "@/hooks/store";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const CycleIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleRemoveFromView,
    handleArchive,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-start",
    parentRef,
  } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getStateById } = useProjectState();
  // derived values
  const stateDetails = getStateById(issue.state_id);
  // auth
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER && !readOnly;
  const isArchivingAllowed = handleArchive && isEditingAllowed;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isDeletingAllowed = isEditingAllowed;

  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`;

  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");

  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: () => {
        setIssueToEdit({
          ...issue,
          cycle_id: cycleId?.toString() ?? null,
        });
        setTrackElement(activeLayout);
        setCreateUpdateIssueModal(true);
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "make-a-copy",
      title: "Make a copy",
      icon: Copy,
      action: () => {
        setTrackElement(activeLayout);
        setCreateUpdateIssueModal(true);
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "open-in-new-tab",
      title: "Open in new tab",
      icon: ExternalLink,
      action: handleOpenInNewTab,
    },
    {
      key: "copy-link",
      title: "Copy link",
      icon: Link,
      action: handleCopyIssueLink,
    },
    {
      key: "remove-from-cycle",
      title: "Remove from cycle",
      icon: XCircle,
      action: () => handleRemoveFromView?.(),
      shouldRender: isEditingAllowed,
    },
    {
      key: "archive",
      title: "Archive",
      description: isInArchivableGroup ? undefined : "Only completed or canceled\nissues can be archived",
      icon: ArchiveIcon,
      className: "items-start",
      iconClassName: "mt-1",
      action: () => setArchiveIssueModal(true),
      disabled: !isInArchivableGroup,
      shouldRender: isArchivingAllowed,
    },
    {
      key: "delete",
      title: "Delete",
      icon: Trash2,
      action: () => {
        setTrackElement(activeLayout);
        setDeleteIssueModal(true);
      },
      shouldRender: isDeletingAllowed,
    },
  ];

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
        storeType={EIssuesStoreType.CYCLE}
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        placement={placements}
        customButton={customActionButton}
        portalElement={portalElement}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
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
