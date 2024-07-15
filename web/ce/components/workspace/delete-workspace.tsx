import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { IWorkspace } from "@plane/types";
// ui
import { Button } from "@plane/ui";
// components
import { DeleteWorkspaceModal } from "@/components/workspace";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspace: FC<TDeleteWorkspace> = observer((props) => {
  const { workspace } = props;
  // states
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);

  return (
    <>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <Disclosure as="div" className="border-t border-custom-border-100">
        {({ open }) => (
          <div className="w-full">
            <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
              <span className="text-lg tracking-tight">Delete Workspace</span>
              {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Disclosure.Button>

            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform opacity-0"
              enterTo="transform opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform opacity-100"
              leaveTo="transform opacity-0"
            >
              <Disclosure.Panel>
                <div className="flex flex-col gap-8">
                  <span className="text-sm tracking-tight">
                    The danger zone of the workspace delete page is a critical area that requires careful consideration
                    and attention. When deleting a workspace, all of the data and resources within that workspace will
                    be permanently removed and cannot be recovered.
                  </span>
                  <div>
                    <Button variant="danger" onClick={() => setDeleteWorkspaceModal(true)}>
                      Delete my workspace
                    </Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>
    </>
  );
});
