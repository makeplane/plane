"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// headless ui
import { AlertTriangleIcon } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// types
import { PROJECT_MEMBER_LEAVE } from "@plane/constants";
import { IProject } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// hooks
import { useEventTracker, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type FormData = {
  projectName: string;
  confirmLeave: string;
};

const defaultValues: FormData = {
  projectName: "",
  confirmLeave: "",
};

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal: FC<ILeaveProjectModal> = observer((props) => {
  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { captureEvent } = useEventTracker();
  const { leaveProject } = useUserPermissions();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const handleClose = () => {
    reset({ ...defaultValues });
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!workspaceSlug) return;

    if (data) {
      if (data.projectName === project?.name) {
        if (data.confirmLeave === "Leave Project") {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();
              captureEvent(PROJECT_MEMBER_LEAVE, {
                state: "SUCCESS",
                element: "Project settings members page",
              });
            })
            .catch(() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Something went wrong please try again later.",
              });
              captureEvent(PROJECT_MEMBER_LEAVE, {
                state: "FAILED",
                element: "Project settings members page",
              });
            });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Please confirm leaving the project by typing the 'Leave Project'.",
          });
        }
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Please enter the project name as shown in the description.",
        });
      }
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please fill all fields.",
      });
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Leave Project</h3>
                    </span>
                  </div>

                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      Are you sure you want to leave the project -
                      <span className="font-medium text-custom-text-100">{` "${project?.name}" `}</span>? All of the
                      work items associated with you will become inaccessible.
                    </p>
                  </span>

                  <div className="text-custom-text-200">
                    <p className="break-words text-sm ">
                      Enter the project name <span className="font-medium text-custom-text-100">{project?.name}</span>{" "}
                      to continue:
                    </p>
                    <Controller
                      control={control}
                      name="projectName"
                      rules={{
                        required: "Label title is required",
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <Input
                          id="projectName"
                          name="projectName"
                          type="text"
                          value={value}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.projectName)}
                          placeholder="Enter project name"
                          className="mt-2 w-full"
                        />
                      )}
                    />
                  </div>

                  <div className="text-custom-text-200">
                    <p className="text-sm">
                      To confirm, type <span className="font-medium text-custom-text-100">Leave Project</span> below:
                    </p>
                    <Controller
                      control={control}
                      name="confirmLeave"
                      render={({ field: { value, onChange, ref } }) => (
                        <Input
                          id="confirmLeave"
                          name="confirmLeave"
                          type="text"
                          value={value}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.confirmLeave)}
                          placeholder="Enter 'leave project'"
                          className="mt-2 w-full"
                        />
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Leaving..." : "Leave Project"}
                    </Button>
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
