import React from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// hooks
import { useApplication, useProject, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// types
import type { IProject } from "@plane/types";

type DeleteProjectModal = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

const defaultValues = {
  projectName: "",
  confirmDelete: "",
};

export const DeleteProjectModal: React.FC<DeleteProjectModal> = (props) => {
  const { isOpen, project, onClose } = props;
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentWorkspace } = useWorkspace();
  const { deleteProject } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const canDelete = watch("projectName") === project?.name && watch("confirmDelete") === "delete my project";

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!workspaceSlug || !canDelete) return;

    await deleteProject(workspaceSlug.toString(), project.id)
      .then(() => {
        if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);

        handleClose();
        postHogEventTracker(
          "PROJECT_DELETED",
          {
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Project deleted successfully.",
        });
      })
      .catch(() => {
        postHogEventTracker(
          "PROJECT_DELETED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again later.",
        });
      });
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Project</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      Are you sure you want to delete project{" "}
                      <span className="break-words font-semibold">{project?.name}</span>? All of the data related to the
                      project will be permanently removed. This action cannot be undone
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
                      render={({ field: { value, onChange, ref } }) => (
                        <Input
                          id="projectName"
                          name="projectName"
                          type="text"
                          value={value}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.projectName)}
                          placeholder="Project name"
                          className="mt-2 w-full"
                          autoComplete="off"
                        />
                      )}
                    />
                  </div>
                  <div className="text-custom-text-200">
                    <p className="text-sm">
                      To confirm, type <span className="font-medium text-custom-text-100">delete my project</span>{" "}
                      below:
                    </p>
                    <Controller
                      control={control}
                      name="confirmDelete"
                      render={({ field: { value, onChange, ref } }) => (
                        <Input
                          id="confirmDelete"
                          name="confirmDelete"
                          type="text"
                          value={value}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.confirmDelete)}
                          placeholder="Enter 'delete my project'"
                          className="mt-2 w-full"
                          autoComplete="off"
                        />
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" type="submit" disabled={!canDelete} loading={isSubmitting}>
                      {isSubmitting ? "Deleting..." : "Delete Project"}
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
};
