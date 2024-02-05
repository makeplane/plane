import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
import { Trash2, Plus, X } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewAppliedFiltersRoot } from "../";
// ui
import { Input, Button } from "@plane/ui";
// types
import { TView, TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";

type TViewCreateEditForm = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  modalToggle: boolean;
  handleModalClose: () => void;
  onSubmit: (viewData: Partial<TView>) => void;
};

export const ViewCreateEditForm: FC<TViewCreateEditForm> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations, modalToggle, handleModalClose, onSubmit } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const onContinue = async () => {
    const payload: Partial<TView> = {
      id: viewDetailStore?.id,
      name: viewDetailStore?.name,
      filters: viewDetailStore?.filters,
    };
    onSubmit(payload);
  };

  return (
    <Transition.Root show={modalToggle} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleModalClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem] py-5 border-[0.1px] border-custom-border-100">
                <div className="p-3 px-5 relative flex items-center gap-2">
                  {/* <div className="relative rounded p-1.5 px-2 flex items-center gap-1 border border-custom-border-100 bg-custom-background-80">
                    <div className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 overflow-hidden">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs uppercase">Project Identifier</div>
                  </div> */}
                  <div className="">Create View</div>
                </div>

                <div className="p-3 px-5">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={viewDetailStore?.name || ""}
                    onChange={(e) => {
                      viewDetailStore?.setName(e.target.value);
                    }}
                    placeholder="What do you want to call this view?"
                    className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                    autoFocus
                  />
                </div>

                <div className="p-3 px-5 relative flex justify-between items-center gap-2">
                  <div className="relative rounded p-1.5 px-2 flex items-center gap-1 border border-custom-border-100 bg-custom-background-80">
                    <div className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 overflow-hidden">
                      <Plus className="w-3 h-3" />
                    </div>
                    <div className="text-xs">Filters</div>
                  </div>
                  <div className="relative rounded p-1.5 px-2 flex items-center gap-1 border border-dashed border-custom-border-100 bg-custom-background-80">
                    <div className="text-xs">Clear all filters</div>
                    <div className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 overflow-hidden">
                      <X className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="p-3 px-5 relative bg-custom-background-80">
                  <ViewAppliedFiltersRoot
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    viewId={viewId}
                    viewType={viewType}
                    viewOperations={viewOperations}
                  />
                </div>

                <div className="p-3 px-5 relative flex justify-end items-center gap-2">
                  <Button variant="neutral-primary" onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={onContinue}>
                    Create View
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
