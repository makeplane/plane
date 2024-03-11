import { useEffect, Fragment, FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { CreateProjectForm } from "./create-project-form";
import { ProjectFeatureUpdate } from "./project-feature-update";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
// hooks
import { useUser } from "hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
};

enum EProjectCreationSteps {
  CREATE_PROJECT = "CREATE_PROJECT",
  FEATURE_SELECTION = "FEATURE_SELECTION",
}

interface IIsGuestCondition {
  onClose: () => void;
}

const IsGuestCondition: FC<IIsGuestCondition> = ({ onClose }) => {
  useEffect(() => {
    onClose();
    setToast({
      title: "Error",
      type: TOAST_TYPE.ERROR,
      message: "You don't have permission to create project.",
    });
  }, [onClose]);

  return null;
};

export const CreateProjectModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug } = props;
  // states
  const [currentStep, setCurrentStep] = useState<EProjectCreationSteps>(EProjectCreationSteps.CREATE_PROJECT);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  // hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(EProjectCreationSteps.CREATE_PROJECT);
      setCreatedProjectId(null);
    }
  }, [isOpen]);

  if (currentWorkspaceRole && isOpen)
    if (currentWorkspaceRole < EUserWorkspaceRoles.MEMBER) return <IsGuestCondition onClose={onClose} />;

  const handleNextStep = (projectId: string) => {
    if (!projectId) return;
    setCreatedProjectId(projectId);
    setCurrentStep(EProjectCreationSteps.FEATURE_SELECTION);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full transform rounded-lg bg-custom-background-100 p-3 text-left shadow-custom-shadow-md transition-all sm:w-3/5 lg:w-1/2 xl:w-2/5">
                {currentStep === EProjectCreationSteps.CREATE_PROJECT && (
                  <CreateProjectForm
                    setToFavorite={setToFavorite}
                    workspaceSlug={workspaceSlug}
                    onClose={onClose}
                    handleNextStep={handleNextStep}
                  />
                )}
                {currentStep === EProjectCreationSteps.FEATURE_SELECTION && (
                  <ProjectFeatureUpdate projectId={createdProjectId} workspaceSlug={workspaceSlug} onClose={onClose} />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
