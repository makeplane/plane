import React from "react";
import { useRouter } from "next/router";
import { CircleHelp } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// components
import { PageEditHistoryMainContent, PageEditHistorySidebar } from "@/components/pages";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const PageEditHistoryModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // router
  const router = useRouter();
  const { projectId, workspaceSlug } = router.query;

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
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
          <div className="h-full w-full grid place-items-center overflow-hidden">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="size-4/5 bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-md rounded-lg overflow-hidden">
                <div className="h-full w-full grid grid-cols-5 overflow-hidden">
                  <div className="h-full col-span-4">
                    <PageEditHistoryMainContent
                      projectId={projectId?.toString() ?? ""}
                      workspaceSlug={workspaceSlug?.toString() ?? ""}
                    />
                  </div>
                  <div className="h-full w-full flex flex-col divide-y divide-custom-border-200 border-l border-custom-border-200 overflow-hidden">
                    <div className="h-full p-1 overflow-y-scroll vertical-scrollbar scrollbar-sm">
                      <PageEditHistorySidebar activeVersionId="" />
                    </div>
                    <div className="py-3 px-4">
                      <Button variant="primary" size="sm">
                        Restore version
                      </Button>
                    </div>
                    <div className="py-3 px-4 flex items-center gap-2 text-custom-text-400 text-sm">
                      <CircleHelp className="h-3 w-3" />
                      Learn about page history
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
