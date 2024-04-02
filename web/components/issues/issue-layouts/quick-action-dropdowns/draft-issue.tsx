import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
// icons
import { Pencil, Trash2 } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constant
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useEventTracker, useIssues, useUser } from "@/hooks/store";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const DraftIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const { issue, handleDelete, handleUpdate, customActionButton, portalElement, readOnly = false } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
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
  const isDeletingAllowed = isEditingAllowed;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: true,
    },
    ["id"]
  );

  return (
    <>
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
        isDraft
      />

      <CustomMenu
        menuItemsClassName="z-[14]"
        placement="bottom-start"
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
              setIssueToEdit(issue);
              setCreateUpdateIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Pencil className="h-3 w-3" />
              Edit
            </div>
          </CustomMenu.MenuItem>
        )}
        {isDeletingAllowed && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement(activeLayout);
              setDeleteIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-3 w-3" />
              Delete
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </>
  );
});
