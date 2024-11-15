import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button, EModalPosition, EModalWidth, ModalCore, setToast, TextArea, TOAST_TYPE } from "@plane/ui";
import { useWorkspace } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
import { PIService } from "@/plane-web/services";

// service initialization
const piService = new PIService();

type TPlannerData = {
  description: string;
};

type TProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ProjectPlannerModal = (props: TProps) => {
  const { isOpen, onClose } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  // router
  const { workspaceSlug, projectId } = useParams();

  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { setValue } = useLocalStorage<string | null>(`planer_task_id_${projectId}`, null);

  // derived values
  const workspace = getWorkspaceBySlug(workspaceSlug as string);

  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TPlannerData>();

  const formRef = useRef(null);

  const handleFormSubmit = async (formData: TPlannerData) => {
    if (!workspace || !projectId) return;

    setIsLoading(true);
    try {
      const response = await piService.createPlanner({
        data: formData.description,
        workspace_id: workspace?.id,
        project_id: projectId.toString(),
      });
      if (response?.task_id) setValue(response?.task_id);
      setToast({
        title: "Success",
        message: "Processing started",
        type: TOAST_TYPE.SUCCESS,
      });
      handleClose();
    } catch (error) {
      setToast({
        title: "Error",
        message: "Project planning request failed",
        type: TOAST_TYPE.ERROR,
      });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex gap-2 bg-transparent w-full">
        <div className="rounded-lg w-full">
          <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col w-full">
            <div className="space-y-5 p-5 rounded-t-lg bg-custom-background-100">
              <div className="items-center justify-between gap-2">
                <h3 className="text-xl font-medium text-custom-text-200">Ask Pi to plan your project</h3>
              </div>
            </div>
            <div className="space-y-5 px-5 pb-5 rounded-t-lg bg-custom-background-100">
              <Controller
                control={control}
                name="description"
                rules={{ required: "Description is required" }}
                render={({ field: { value, onChange } }) => (
                  <TextArea
                    id="description"
                    name="description"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors.description)}
                    placeholder="Your input"
                    className="min-h-[102px] w-full rounded-md font-normal text-sm bg-transparent max-h-[70vh]"
                  />
                )}
              />
              {errors.description?.message && <p className="text-sm text-red-500">{errors.description?.message}</p>}
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200 rounded-b-lg bg-custom-background-100">
              <div className="flex mx-auto mr-0 gap-3">
                <Button variant="neutral-primary" size="sm" type="button" onClick={handleClose}>
                  Discard
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={isLoading}>
                  {isLoading ? "Planning" : "Create a plan"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalCore>
  );
};
