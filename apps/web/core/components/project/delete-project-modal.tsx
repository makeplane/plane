import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
// Plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
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

export function DeleteProjectModal(props: DeleteProjectModal) {
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

    try {
      await deleteProject(workspaceSlug.toString(), project.id);
      if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Project deleted successfully.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">Delete project</h3>
          </span>
        </div>
        <span>
          <p className="text-13 leading-7 text-secondary">
            Are you sure you want to delete project <span className="break-words font-semibold">{project?.name}</span>?
            All of the data related to the project will be permanently removed. This action cannot be undone
          </p>
        </span>
        <div className="text-secondary">
          <p className="break-words text-13 ">
            Enter the project name <span className="font-medium text-primary">{project?.name}</span> to continue:
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
        <div className="text-secondary">
          <p className="text-13">
            To confirm, type <span className="font-medium text-primary">delete my project</span> below:
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
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="error-fill" size="lg" type="submit" disabled={!canDelete} loading={isSubmitting}>
            {isSubmitting ? "Deleting" : "Delete project"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
