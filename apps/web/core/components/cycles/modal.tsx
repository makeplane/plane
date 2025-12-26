import { useEffect, useState } from "react";
import { mutate } from "swr";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { CycleDateCheckData, ICycle, TCycleTabOptions } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { renderFormattedPayloadDate } from "@plane/utils";
import { useCycle } from "@/hooks/store/use-cycle";
import { useProject } from "@/hooks/store/use-project";
import useKeypress from "@/hooks/use-keypress";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { CycleService } from "@/services/cycle.service";
// local imports
import { CycleForm } from "./form";

type CycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ICycle | null;
  workspaceSlug: string;
  projectId: string;
};

// services
const cycleService = new CycleService();

export function CycleCreateUpdateModal(props: CycleModalProps) {
  const { isOpen, handleClose, data, workspaceSlug, projectId } = props;
  // states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  // store hooks
  const { workspaceProjectIds } = useProject();
  const { createCycle, updateCycleDetails } = useCycle();
  const { isMobile } = usePlatformOS();

  const { setValue: setCycleTab } = useLocalStorage<TCycleTabOptions>("cycle_tab", "active");

  const handleCreateCycle = async (payload: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await createCycle(workspaceSlug, selectedProjectId, payload)
      .then((res) => {
        // mutate when the current cycle creation is active
        if (payload.start_date && payload.end_date) {
          const currentDate = new Date();
          const cycleStartDate = new Date(payload.start_date);
          const cycleEndDate = new Date(payload.end_date);
          if (currentDate >= cycleStartDate && currentDate <= cycleEndDate) {
            mutate(`PROJECT_ACTIVE_CYCLE_${selectedProjectId}`);
          }
        }

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Cycle created successfully.",
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Error in creating cycle. Please try again.",
        });
      });
  };

  const handleUpdateCycle = async (cycleId: string, payload: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await updateCycleDetails(workspaceSlug, selectedProjectId, cycleId, payload)
      .then((res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Error in updating cycle. Please try again.",
        });
      });
  };

  const dateChecker = async (projectId: string, payload: CycleDateCheckData) => {
    let status = false;

    await cycleService.cycleDateCheck(workspaceSlug, projectId, payload).then((res) => {
      status = res.status;
    });

    return status;
  };

  const handleFormSubmit = async (formData: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<ICycle> = {
      ...formData,
      start_date: renderFormattedPayloadDate(formData.start_date) ?? null,
      end_date: renderFormattedPayloadDate(formData.end_date) ?? null,
    };

    let isDateValid: boolean = true;

    if (payload.start_date && payload.end_date) {
      if (data?.id) {
        // Update existing cycle - only check dates if they've changed
        const originalStartDate = renderFormattedPayloadDate(data.start_date) ?? null;
        const originalEndDate = renderFormattedPayloadDate(data.end_date) ?? null;
        const hasDateChanged = payload.start_date !== originalStartDate || payload.end_date !== originalEndDate;

        if (hasDateChanged) {
          isDateValid = await dateChecker(projectId, {
            start_date: payload.start_date,
            end_date: payload.end_date,
            cycle_id: data.id,
          });
        }
      } else {
        // Create new cycle - always check dates
        isDateValid = await dateChecker(projectId, {
          start_date: payload.start_date,
          end_date: payload.end_date,
        });
      }
    }

    if (isDateValid) {
      if (data?.id) await handleUpdateCycle(data.id, payload);
      else {
        await handleCreateCycle(payload).then(() => {
          setCycleTab("all");
        });
      }
      handleClose();
    } else
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "You already have a cycle on the given dates, if you want to create a draft cycle, remove the dates.",
      });
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

  useKeypress("Escape", () => {
    if (isOpen) handleClose();
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <CycleForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        status={!!data}
        projectId={activeProject ?? ""}
        setActiveProject={setActiveProject}
        data={data}
        isMobile={isMobile}
      />
    </ModalCore>
  );
}
