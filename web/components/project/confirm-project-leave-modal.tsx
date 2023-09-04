import React from "react";
// next imports
import { useRouter } from "next/router";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { DangerButton, Input, SecondaryButton } from "components/ui";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
import useProjects from "hooks/use-projects";
// types
import { IProject } from "types";

type FormData = {
  projectName: string;
  confirmLeave: string;
};

const defaultValues: FormData = {
  projectName: "",
  confirmLeave: "",
};

export const ConfirmProjectLeaveModal: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const store: RootStore = useMobxStore();
  const { project } = store;

  const { user } = useUser();
  const { mutateProjects } = useProjects();

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const handleClose = () => {
    project.handleProjectLeaveModal(null);

    reset({ ...defaultValues });
  };

  const onSubmit = async (data: any) => {
    if (data) {
      if (data.projectName === project?.projectLeaveDetails?.name) {
        if (data.confirmLeave === "Leave Project") {
          return project
            .leaveProject(
              project.projectLeaveDetails.workspaceSlug.toString(),
              project.projectLeaveDetails.id.toString(),
              user
            )
            .then((res) => {
              mutateProjects();
              handleClose();
              router.push(`/${workspaceSlug}/projects`);
            })
            .catch((err) => {
              setToastAlert({
                type: "error",
                title: "Error!",
                message: "Something went wrong please try again later.",
              });
            });
        } else {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Please confirm leaving the project by typing the 'Leave Project'.",
          });
        }
      } else {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Please enter the project name as shown in the description.",
        });
      }
    } else {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please fill all fields.",
      });
    }
  };

  return (
    <Transition.Root show={project.projectLeaveModal} as={React.Fragment}>
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Leave Project</h3>
                    </span>
                  </div>

                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      Are you sure you want to leave the project -
                      <span className="font-medium text-custom-text-100">{` "${project?.projectLeaveDetails?.name}" `}</span>
                      ? All of the issues associated with you will become inaccessible.
                    </p>
                  </span>

                  <div className="text-custom-text-200">
                    <p className="break-words text-sm ">
                      Enter the project name{" "}
                      <span className="font-medium text-custom-text-100">
                        {project?.projectLeaveDetails?.name}
                      </span>{" "}
                      to continue:
                    </p>
                    <Controller
                      control={control}
                      name="projectName"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="text"
                          placeholder="Enter project name"
                          className="mt-2"
                          value={value}
                          onChange={onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="text-custom-text-200">
                    <p className="text-sm">
                      To confirm, type{" "}
                      <span className="font-medium text-custom-text-100">Leave Project</span> below:
                    </p>
                    <Controller
                      control={control}
                      name="confirmLeave"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="text"
                          placeholder="Enter 'leave project'"
                          className="mt-2"
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <DangerButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Leaving..." : "Leave Project"}
                    </DangerButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
