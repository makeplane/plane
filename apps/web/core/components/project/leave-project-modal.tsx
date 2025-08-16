"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
// types
import { MEMBER_TRACKER_EVENTS } from "@plane/constants";
import { IProject } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// constants
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserPermissions } from "@/hooks/store";
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
              captureSuccess({
                eventName: MEMBER_TRACKER_EVENTS.project.leave,
                payload: {
                  project: project.id,
                },
              });
            })
            .catch((err) => {
              captureError({
                eventName: MEMBER_TRACKER_EVENTS.project.leave,
                payload: {
                  project: project.id,
                },
                error: err,
              });
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Something went wrong please try again later.",
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
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
              <span className="font-medium text-custom-text-100">{` "${project?.name}" `}</span>? All of the work items
              associated with you will become inaccessible.
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
    </Dialog>
  );
});
