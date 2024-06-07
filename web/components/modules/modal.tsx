import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
// types
import type { IModule } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { ModuleForm } from "@/components/modules";
// constants
import { MODULE_CREATED, MODULE_UPDATED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useModule, useProject } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: IModule;
  workspaceSlug: string;
  projectId: string;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead_id: null,
  member_ids: [],
};

export const CreateUpdateModuleModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, workspaceSlug, projectId } = props;
  // states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  // store hooks
  const { captureModuleEvent } = useEventTracker();
  const { workspaceProjectIds } = useProject();
  const { createModule, updateModuleDetails } = useModule();

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const { reset } = useForm<IModule>({
    defaultValues,
  });

  const handleCreateModule = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await createModule(workspaceSlug.toString(), selectedProjectId, payload)
      .then((res) => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module created successfully.",
        });
        captureModuleEvent({
          eventName: MODULE_CREATED,
          payload: { ...res, state: "SUCCESS" },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Module could not be created. Please try again.",
        });
        captureModuleEvent({
          eventName: MODULE_CREATED,
          payload: { ...data, state: "FAILED" },
        });
      });
  };

  const handleUpdateModule = async (payload: Partial<IModule>, dirtyFields: any) => {
    if (!workspaceSlug || !projectId || !data) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await updateModuleDetails(workspaceSlug.toString(), selectedProjectId, data.id, payload)
      .then((res) => {
        handleClose();

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module updated successfully.",
        });
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...res, changed_properties: Object.keys(dirtyFields || {}), state: "SUCCESS" },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Module could not be updated. Please try again.",
        });
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...data, state: "FAILED" },
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IModule>, dirtyFields: unknown) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IModule> = {
      ...formData,
    };
    if (!data) await handleCreateModule(payload);
    else await handleUpdateModule(payload, dirtyFields);
  };

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project_id) {
      setActiveProject(data.project_id);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (workspaceProjectIds && workspaceProjectIds.length > 0 && !activeProject)
      setActiveProject(projectId ?? workspaceProjectIds?.[0] ?? null);
  }, [activeProject, data, projectId, workspaceProjectIds, isOpen]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <ModuleForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        status={data ? true : false}
        projectId={activeProject ?? ""}
        setActiveProject={setActiveProject}
        data={data}
      />
    </ModalCore>
  );
});
