"use client";

import React, { useEffect, useState } from "react";
import { mutate } from "swr";
// types
import type { CycleDateCheckData, ICycle, TCycleTabOptions } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CycleForm } from "@/components/cycles";
// constants
import { CYCLE_CREATED, CYCLE_UPDATED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useCycle, useProject } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
// services
import { CycleService } from "@/services/cycle.service";

type CycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ICycle | null;
  workspaceSlug: string;
  projectId: string;
};

// services
const cycleService = new CycleService();

export const CycleCreateUpdateModal: React.FC<CycleModalProps> = (props) => {
  const { isOpen, handleClose, data, workspaceSlug, projectId } = props;
  // states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  // store hooks
  const { captureCycleEvent } = useEventTracker();
  const { workspaceProjectIds } = useProject();
  const { createCycle, updateCycleDetails } = useCycle();

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
        captureCycleEvent({
          eventName: CYCLE_CREATED,
          payload: { ...res, state: "SUCCESS" },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Error in creating cycle. Please try again.",
        });
        captureCycleEvent({
          eventName: CYCLE_CREATED,
          payload: { ...payload, state: "FAILED" },
        });
      });
  };

  const handleUpdateCycle = async (cycleId: string, payload: Partial<ICycle>, dirtyFields: any) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await updateCycleDetails(workspaceSlug, selectedProjectId, cycleId, payload)
      .then((res) => {
        const changed_properties = Object.keys(dirtyFields);
        captureCycleEvent({
          eventName: CYCLE_UPDATED,
          payload: { ...res, changed_properties: changed_properties, state: "SUCCESS" },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch((err) => {
        captureCycleEvent({
          eventName: CYCLE_UPDATED,
          payload: { ...payload, state: "FAILED" },
        });
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

  const handleFormSubmit = async (formData: Partial<ICycle>, dirtyFields: any) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<ICycle> = {
      ...formData,
    };

    let isDateValid: boolean = true;

    if (payload.start_date && payload.end_date) {
      if (data?.start_date && data?.end_date)
        isDateValid = await dateChecker(payload.project_id ?? projectId, {
          start_date: payload.start_date,
          end_date: payload.end_date,
          cycle_id: data.id,
        });
      else
        isDateValid = await dateChecker(payload.project_id ?? projectId, {
          start_date: payload.start_date,
          end_date: payload.end_date,
        });
    }

    if (isDateValid) {
      if (data) await handleUpdateCycle(data.id, payload, dirtyFields);
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

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <CycleForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        status={data ? true : false}
        projectId={activeProject ?? ""}
        setActiveProject={setActiveProject}
        data={data}
      />
    </ModalCore>
  );
};
