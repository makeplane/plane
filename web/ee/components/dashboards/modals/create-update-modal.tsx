import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane types
import { TDashboard } from "@plane/types";
// plane ui
import { Button, EModalPosition, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ProjectDropdown } from "@/components/dropdowns";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
import { useParams } from "next/navigation";

type Props = {
  data?: Partial<TDashboard>;
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: Partial<TDashboard> = {
  name: "",
  project_ids: [],
};

export const CreateUpdateWorkspaceDashboardModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // app router
  const router = useAppRouter();
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { canCurrentUserCreateDashboard, createDashboard },
  } = useDashboards();
  const { getProjectById } = useProject();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<TDashboard>({
    defaultValues,
  });
  // derived value
  const isEditing = !!data?.id;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
    }, 300);
  };

  const handleCreate = async (payload: Partial<TDashboard>) => {
    if (!canCurrentUserCreateDashboard) return;
    return await createDashboard(payload);
  };

  const handleUpdate = async (payload: Partial<TDashboard>) => {
    if (!isEditing || !data?.id) return;
    const { updateDashboard } = getDashboardById(data.id) ?? {};
    await updateDashboard?.(payload);
  };

  const handleFormSubmit = async (payload: Partial<TDashboard>) => {
    try {
      if (isEditing) {
        await handleUpdate(payload);
      } else {
        const res = await handleCreate(payload);
        router.push(`/${workspaceSlug?.toString()}/dashboards/${res?.id}`);
      }
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  // update form values from pre-defined data
  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  if (!canCurrentUserCreateDashboard) return;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">{isEditing ? "Update" : "Create new"} dashboard</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Title is required",
                  maxLength: {
                    value: 255,
                    message: "Title should be less than 255 characters",
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    type="text"
                    placeholder="Title"
                    className="w-full text-base"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors?.name)}
                    autoFocus
                  />
                )}
              />
              <span className="text-xs text-red-500">{errors?.name?.message}</span>
            </div>
            <div>
              <div className="flex justify-between gap-1 mb-2">
                <label className="text-sm text-custom-text-200">Choose projects</label>
                <span className="text-xs text-custom-text-300">Data will be imported from the selections</span>
              </div>
              <div className="space-y-1">
                <Controller
                  name="project_ids"
                  control={control}
                  rules={{
                    required: "Projects are required",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ProjectDropdown
                      value={value ?? []}
                      onChange={(val) => {
                        if (Array.isArray(val)) {
                          onChange(val);
                        }
                      }}
                      button={
                        <div className="p-3 rounded-md border-[0.5px] border-custom-border-200 text-left flex items-center gap-2 flex-wrap">
                          {value && value.length > 0 ? (
                            value.map((projectId) => {
                              const projectDetails = getProjectById(projectId);
                              if (!projectDetails) return null;
                              return (
                                <div
                                  key={projectId}
                                  className="p-1 rounded bg-custom-background-80 text-sm text-custom-text-200 flex items-center gap-1"
                                >
                                  <span className="flex-shrink-0 size-4 grid place-items-center">
                                    <Logo logo={projectDetails.logo_props} size={16} />
                                  </span>
                                  {projectDetails.name}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-base text-custom-text-400">Choose project</span>
                          )}
                        </div>
                      }
                      multiple
                      buttonVariant="border-with-text"
                    />
                  )}
                />
                <span className="text-xs text-red-500">{errors?.project_ids?.message}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {data ? (isSubmitting ? "Updating" : "Update dashboard") : isSubmitting ? "Creating" : "Create dashboard"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
