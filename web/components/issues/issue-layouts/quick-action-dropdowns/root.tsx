import { useState } from "react";
import { observer } from "mobx-react";
import { ArchiveIcon, ExternalLink, Link, Trash2 } from "lucide-react";
// ui
import { TIssue } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveIssueModal, DeleteIssueModal } from "@/components/issues";
// constants
import { EUserProjectRoles } from "@/constants/project";
import { STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useProjectState, useUser } from "@/hooks/store";

type Props = {
  extraOptions?: TContextMenuItem[];
  handleArchive?: () => Promise<void>;
  handleDelete: () => Promise<void>;
  issue: TIssue;
  parentRef: React.RefObject<HTMLElement>;
  readOnly: boolean;
  workspaceSlug: string;
};

export const IssueQuickActions: React.FC<Props> = observer((props) => {
  const { extraOptions, handleArchive, handleDelete, issue, parentRef, readOnly, workspaceSlug } = props;
  // states
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getStateById } = useProjectState();
  // derived values
  const stateDetails = getStateById(issue.state_id);
  // auth
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER && !readOnly;
  const isArchivingAllowed = handleArchive && isEditingAllowed;
  const isInArchivableGroup =
    !!stateDetails && [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateDetails?.group);
  const isDeletingAllowed = isEditingAllowed;

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`;
  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
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
      action: () => setDeleteIssueModal(true),
      shouldRender: isDeletingAllowed,
    },
    ...(extraOptions ?? []),
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
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end">
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
