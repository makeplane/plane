import { FC, useState } from "react";
import { Flatfile } from "@flatfile/api";
import { makeTheme, Space, useEvent, useFlatfile, Workbook } from "@flatfile/react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { E_IMPORTER_KEYS, E_JOB_STATUS } from "@plane/etl/core";
import { FlatfileConfig } from "@plane/etl/flatfile";
import { TImportJob } from "@plane/types";
import { Button, setToast, TOAST_TYPE, Loader } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import DynamicFlatfileProvider from "@/plane-web/components/importers/flatfile/steps/configure-flatfile/provider";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// types
import { useFlatfileImporter } from "@/plane-web/hooks/store/importers/user-flatfile";
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers";
import { getWorkbookConfig } from "./workbook";

export const ConfigureFlatfile: FC = observer(() => {
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_FLATFILE_PUBLISHABLE_KEY;
  if (!PUBLISHABLE_KEY)
    return (
      <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
        Looks like the app environment is not configured to use this feature.
      </div>
    );

  return (
    <DynamicFlatfileProvider publishableKey={PUBLISHABLE_KEY} config={{ spaceUrl: "https://spaces.flatfile.com" }}>
      <ConfigureFlatfileChild />
    </DynamicFlatfileProvider>
  );
});

export const ConfigureFlatfileChild: FC = observer(() => {
  const {
    workspace,
    user,
    importerData: {
      [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: { projectId: planeProjectId },
    },
    job: { createJob, startJob },
    handleStepper,
    resetImporterData,
    currentStep,
    stateIdsByProjectId,
    getStateById,
    fetchStates,
  } = useFlatfileImporter();

  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const { openPortal, closePortal } = useFlatfile();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // fetching the plane project states
  const { isLoading: isPlaneProjectStatesLoading } = useSWR(
    workspaceSlug && planeProjectId ? `IMPORTER_PLANE_STATES_${workspaceSlug}_${planeProjectId}` : null,
    workspaceSlug && planeProjectId ? async () => fetchStates(workspaceSlug, planeProjectId) : null,
    { errorRetryCount: 0 }
  );

  useEvent(
    "job:completed",
    {
      operation: `submitAction`,
      status: "complete",
    },
    async (event) => {
      setIsSubmitting(true);
      await createAndStartJob(event.context);
      closePortal();
      resetImporterData();
      setIsSubmitting(false);
    }
  );

  if (isPlaneProjectStatesLoading) {
    return (
      <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
        <Loader.Item height="35px" width="100%" />
      </Loader>
    );
  }

  // Get project states from store
  const projectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((state) => state != undefined && state != null);

  const createAndStartJob = async (config: FlatfileConfig) => {
    try {
      const jobId = await handleJobSubmission(config);
      await handleStartJob(jobId);
      // Set the toast for success message
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Job created successfully",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Something went wrong while creating job",
      });
    }
  };

  const handleJobSubmission = async (config: FlatfileConfig): Promise<string> => {
    if (!workspace || !user || !planeProjectId) {
      throw new Error("Required fields not present for creating job");
    }
    const syncJobPayload: Partial<TImportJob> = {
      workspace_slug: workspaceSlug,
      workspace_id: workspaceId,
      project_id: planeProjectId,
      initiator_id: userId,
      status: E_JOB_STATUS.CREATED,
      config: config,
      source: E_IMPORTER_KEYS.FLATFILE,
    };
    const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
    captureSuccess({
      eventName: IMPORTER_TRACKER_EVENTS.CREATE_FLATFILE_JOB,
      payload: {
        jobId: importerCreateJob?.id,
      },
    });

    if (!importerCreateJob?.id) {
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.CREATE_FLATFILE_JOB,
      });
      throw new Error("Failed to create job");
    }

    return importerCreateJob?.id;
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await startJob(jobId);
      captureSuccess({
        eventName: IMPORTER_TRACKER_EVENTS.START_FLATFILE_JOB,
        payload: {
          jobId: jobId,
        },
      });
    } catch (error) {
      captureError({
        eventName: IMPORTER_TRACKER_EVENTS.START_FLATFILE_JOB,
        error: error as Error,
      });
    }
  };

  // Get workbook configuration with project states
  const workbookConfig = getWorkbookConfig(projectStates);

  const spaceProps: Flatfile.SpaceConfig = {
    name: "Embedded Space",
    namespace: "flatfile_import",
    metadata: {
      theme: makeTheme({ primaryColor: "#546a76", textColor: "#fff" }),
      workbookConfig,
      sidebarConfig: {
        showDataChecklist: false,
        showSidebar: false,
      },
    },
  };

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      <div id="flatfile_container" className="w-full min-h-44 max-h-full overflow-y-auto">
        <Space config={spaceProps}>{<Workbook config={workbookConfig} />}</Space>
      </div>
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={openPortal}>
            {isSubmitting ? "Submitting..." : "Upload CSV"}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
