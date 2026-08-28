/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
// Plane imports
import { Button } from "@makeplane/propel/components/button";
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
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

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
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
            })
            .catch((_err) => {
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangleIcon className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">Leave Project</h3>
          </span>
        </div>

        <span>
          <p className="text-13 leading-7 text-secondary">
            Are you sure you want to leave the project -
            <span className="font-medium text-primary">{` "${project?.name}" `}</span>? All of the work items associated
            with you will become inaccessible.
          </p>
        </span>

        <div className="text-secondary">
          <p className="text-13 break-words">
            Enter the project name <span className="font-medium text-primary">{project?.name}</span> to continue:
          </p>
          <Controller
            control={control}
            name="projectName"
            rules={{
              required: "Label title is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Field name="projectName" invalid={Boolean(errors.projectName)}>
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id="projectName"
                    name="projectName"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder="Enter project name"
                  />
                </InputGroup>
              </Field>
            )}
          />
        </div>

        <div className="text-secondary">
          <p className="text-13">
            To confirm, type <span className="font-medium text-primary">Leave Project</span> below:
          </p>
          <Controller
            control={control}
            name="confirmLeave"
            render={({ field: { value, onChange, ref } }) => (
              <Field name="confirmLeave" invalid={Boolean(errors.confirmLeave)}>
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id="confirmLeave"
                    name="confirmLeave"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder="Enter 'leave project'"
                  />
                </InputGroup>
              </Field>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={handleClose} />
          <Button
            variant="danger"
            size="md"
            stretch="auto"
            label={isSubmitting ? "Leaving..." : "Leave Project"}
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>
    </ModalCore>
  );
});
