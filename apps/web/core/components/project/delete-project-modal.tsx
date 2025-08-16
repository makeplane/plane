"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
// types
import { PROJECT_TRACKER_EVENTS } from "@plane/constants";
import type { IProject } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// constants
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

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
  const { deleteProject } = useProject();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
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
        captureSuccess({
          eventName: PROJECT_TRACKER_EVENTS.delete,
          payload: {
            id: project.id,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project deleted successfully.",
        });
      })
      .catch(() => {
        captureError({
          eventName: PROJECT_TRACKER_EVENTS.delete,
          payload: {
            id: project.id,
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again later.",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
          <div className="flex w-full items-center justify-start gap-6">
            <span className="place-items-center rounded-full bg-red-500/20 p-4">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </span>
            <span className="flex items-center justify-start">
              <h3 className="text-xl font-medium 2xl:text-2xl">Delete project</h3>
            </span>
          </div>
          <span>
            <p className="text-sm leading-7 text-custom-text-200">
              Are you sure you want to delete project <span className="break-words font-semibold">{project?.name}</span>
              ? All of the data related to the project will be permanently removed. This action cannot be undone
            </p>
          </span>
          <div className="text-custom-text-200">
            <p className="break-words text-sm ">
              Enter the project name <span className="font-medium text-custom-text-100">{project?.name}</span> to
              continue:
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
              To confirm, type <span className="font-medium text-custom-text-100">delete my project</span> below:
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
              {isSubmitting ? "Deleting" : "Delete project"}
            </Button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
};
