import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useIssues, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { DraftIssueLayout } from "./draft-issue-layout";
import { IssueFormRoot } from "./form";
// types
import type { TIssue } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (res: Partial<TIssue>) => Promise<void>;
  withDraftIssueWrapper?: boolean;
}

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const { data, isOpen, onClose, onSubmit, withDraftIssueWrapper = true } = props;
  // states
  const [changesMade, setChangesMade] = useState<Partial<TIssue> | null>(null);
  const [createMore, setCreateMore] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { workspaceProjectIds } = useProject();
  const {
    issues: { createIssue, updateIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    issues: { addIssueToCycle },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    issues: { addIssueToModule },
  } = useIssues(EIssuesStoreType.MODULE);
  // toast alert
  const { setToastAlert } = useToast();
  // local storage
  const { setValue: setLocalStorageDraftIssue } = useLocalStorage<any>("draftedIssue", {});

  const handleCreateMoreToggleChange = (value: boolean) => {
    setCreateMore(value);
  };

  const handleClose = (saveDraftIssueInLocalStorage?: boolean) => {
    if (changesMade && saveDraftIssueInLocalStorage) {
      const draftIssue = JSON.stringify(changesMade);
      setLocalStorageDraftIssue(draftIssue);
    }
    onClose();
  };

  const handleCreateIssue = async (payload: Partial<TIssue>): Promise<TIssue | null> => {
    if (!workspaceSlug || !payload.project_id) return null;

    await createIssue(workspaceSlug.toString(), payload.project_id, payload)
      .then(async (res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });
        !createMore && handleClose();
        return res;
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });

    return null;
  };

  const handleUpdateIssue = async (payload: Partial<TIssue>): Promise<TIssue | null> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return null;

    await updateIssue(workspaceSlug.toString(), payload.project_id, data.id, payload)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue updated successfully.",
        });
        handleClose();
        return { ...payload, ...res };
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be updated. Please try again.",
        });
      });

    return null;
  };

  const handleFormSubmit = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !formData.project_id) return;

    const payload: Partial<TIssue> = {
      ...formData,
      description_html: formData.description_html ?? "<p></p>",
    };

    let res: TIssue | null = null;
    if (!data?.id) res = await handleCreateIssue(payload);
    else res = await handleUpdateIssue(payload);

    // add issue to cycle if cycle is selected, and cycle is different from current cycle
    if (formData.cycle_id && res && (!data?.id || formData.cycle_id !== data?.cycle_id))
      await addIssueToCycle(workspaceSlug.toString(), formData.project_id, formData.cycle_id, [res.id]);

    // add issue to module if module is selected, and module is different from current module
    if (formData.module_id && res && (!data?.id || formData.module_id !== data?.module_id))
      await addIssueToModule(workspaceSlug.toString(), formData.project_id, formData.module_id, [res.id]);

    if (res && onSubmit) await onSubmit(res);
  };

  const handleFormChange = (formData: Partial<TIssue> | null) => setChangesMade(formData);

  // don't open the modal if there are no projects
  if (!workspaceProjectIds || workspaceProjectIds.length === 0) return null;

  // if project id is present in the router query, use that as the selected project id, otherwise use the first project id
  const selectedProjectId = projectId ? projectId.toString() : workspaceProjectIds[0];

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => handleClose(true)}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full mx-4 sm:max-w-4xl">
                {withDraftIssueWrapper ? (
                  <DraftIssueLayout
                    changesMade={changesMade}
                    data={data}
                    onChange={handleFormChange}
                    onClose={handleClose}
                    onSubmit={handleFormSubmit}
                    projectId={selectedProjectId}
                    isCreateMoreToggleEnabled={createMore}
                    onCreateMoreToggleChange={handleCreateMoreToggleChange}
                  />
                ) : (
                  <IssueFormRoot
                    data={data}
                    onClose={() => handleClose(false)}
                    isCreateMoreToggleEnabled={createMore}
                    onCreateMoreToggleChange={handleCreateMoreToggleChange}
                    onSubmit={handleFormSubmit}
                    projectId={selectedProjectId}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
