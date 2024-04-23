import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Copy, Pencil } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { TContextMenuItem } from "@plane/ui";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useEventTracker, useIssues, useUser } from "@/hooks/store";
// types
import { IQuickActionProps } from "../list/list-view-types";
import { IssueQuickActions } from "./root";

export const ProjectIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    customActionButton,
    portalElement,
    readOnly = false,
    parentRef,
    placements = "bottom-start",
  } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER && !readOnly;

  const isDraftIssue = router?.asPath?.includes("draft-issues") || false;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: isDraftIssue ? false : issue.is_draft,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
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
      title: "Make a copy",
      icon: Copy,
      action: () => {
        setTrackElement(activeLayout);
        setCreateUpdateIssueModal(true);
      },
    },
  ];

  return (
    <>
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
      {workspaceSlug && (
        <IssueQuickActions
          extraOptions={MENU_ITEMS}
          handleArchive={handleArchive}
          handleDelete={handleDelete}
          issue={issue}
          parentRef={parentRef}
          readOnly={readOnly}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      {/* <CustomMenu
        menuItemsClassName="z-[14]"
        placement={placements}
        customButton={customActionButton}
        portalElement={portalElement}
        maxHeight="lg"
        closeOnSelect
        ellipsis
      >
        {isEditingAllowed && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement(activeLayout);
              setCreateUpdateIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Copy className="h-3 w-3" />
              Make a copy
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu> */}
    </>
  );
});
