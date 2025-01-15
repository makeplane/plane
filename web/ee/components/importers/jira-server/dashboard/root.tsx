"use client";

import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
import { Briefcase, CircleX, Loader, RefreshCcw } from "lucide-react";
import { E_JOB_STATUS, TJobWithConfig } from "@plane/etl/core";
import { JiraConfig } from "@plane/etl/jira";
import { TLogoProps } from "@plane/types";
import { Button, ModalCore } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";
// plane web components
import { IconFieldRender, SyncJobStatus } from "@/plane-web/components/importers/jira-server";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
// assets
import JiraLogo from "@/public/services/jira.svg";

export const Dashboard: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth, deactivateAuth, apiTokenVerification },
    handleDashboardView,
    job: { loader, jobIds, jobById, startJob, cancelJob, fetchJobs },
  } = useJiraServerImporter();
  // states
  const [deactivateLoader, setDeactivateLoader] = useState<boolean>(false);
  const [reRunJobId, setReRunJobId] = useState<string | undefined>(undefined);
  const [cancelJobId, setCancelJobId] = useState<string | undefined>(undefined);
  const [isRerunModalOpen, setIsRerunModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [modalLoader, setModalLoader] = useState<boolean>(false);

  // fetching jobs
  useSWR(
    currentAuth?.isAuthenticated ? `IMPORTER_JOBS_JIRA` : null,
    currentAuth?.isAuthenticated ? async () => await fetchJobs() : null,
    { errorRetryCount: 0 }
  );

  // derived values
  const isReRunDisabled = (job: TJobWithConfig<JiraConfig>) => {
    if (!job || !job?.status) return true;

    return ![E_JOB_STATUS.CREATED, E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.CANCELLED].includes(
      job?.status as E_JOB_STATUS
    );
  };

  const isCancelDisabled = (job: TJobWithConfig<JiraConfig>) => {
    if (!job || !job?.status) return true;

    // If the job is in created or finished or error state, then disable the cancel button
    return [E_JOB_STATUS.FINISHED, E_JOB_STATUS.ERROR, E_JOB_STATUS.CANCELLED].includes(job?.status as E_JOB_STATUS);
  };

  // handlers
  const handleRerunOpen = (jobId: string) => {
    setReRunJobId(jobId);
    setIsRerunModalOpen(true);
  };

  const handleCancelOpen = (jobId: string) => {
    setCancelJobId(jobId);
    setIsCancelModalOpen(true);
  };

  const handleClose = () => {
    setReRunJobId(undefined);
    setCancelJobId(undefined);
    setIsRerunModalOpen(false);
    setIsCancelModalOpen(false);
  };

  const handleReRunJob = async () => {
    try {
      if (currentAuth?.isAuthenticated && reRunJobId) {
        setModalLoader(true);
        await startJob(reRunJobId);
        await handleJobsRefresh();
        handleClose();
      }
    } catch (error) {
      console.error("Error while re-running Jira job", error);
    } finally {
      setModalLoader(false);
    }
  };

  const handleCancelJob = async () => {
    try {
      if (currentAuth?.isAuthenticated && cancelJobId) {
        setModalLoader(true);
        await cancelJob(cancelJobId);
        await handleJobsRefresh();
        handleClose();
      }
    } catch (error) {
      console.error("Error while cancelling Jira job", error);
    } finally {
      setModalLoader(false);
    }
  };

  const handleJobsRefresh = async () => {
    try {
      if (currentAuth?.isAuthenticated) {
        await apiTokenVerification();
        await fetchJobs("re-fetch");
      }
    } catch (error) {
      console.error("Error while refreshing Jira jobs", error);
    }
  };

  const handleDeactivateAuth = async () => {
    try {
      if (currentAuth?.isAuthenticated) {
        setDeactivateLoader(true);
        await deactivateAuth();
        setDeactivateLoader(false);
      }
    } catch (error) {
      console.error("Error while deactivating Jira auth", error);
      setDeactivateLoader(false);
    }
  };

  return (
    <Fragment>
      {/* rerun job confirm modal */}
      <ModalCore isOpen={isRerunModalOpen} handleClose={handleClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-xl font-medium text-custom-text-200">Re Run Import Job</div>
            <div className="text-sm text-custom-text-300">
              Are you sure you want to re-run this job? This will start the import process again for this project.
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleReRunJob} loading={modalLoader} disabled={modalLoader}>
              {modalLoader ? "Processing" : "Continue"}
            </Button>
          </div>
        </div>
      </ModalCore>

      <ModalCore isOpen={isCancelModalOpen} handleClose={handleClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-xl font-medium text-custom-text-200">Cancel Import Job</div>
            <div className="text-sm text-custom-text-300">
              Are you sure you want to cancel this job? This will stop the import process for this project.
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCancelJob} loading={modalLoader} disabled={modalLoader}>
              {modalLoader ? "Cancelling" : "Continue"}
            </Button>
          </div>
        </div>
      </ModalCore>

      <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
        <div className="flex-shrink-0 text-lg font-medium">Imports</div>

        {/* header */}
        <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90 p-4">
          <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
            <Image src={JiraLogo} layout="fill" objectFit="contain" alt={`Jira Logo`} />
          </div>
          <div className="w-full h-full overflow-hidden">
            <div className="text-lg font-medium">Jira Server</div>
            <div className="text-sm text-custom-text-200">Import your Jira data into plane projects.</div>
          </div>
          <div className="flex-shrink-0 relative flex items-center gap-4">
            <Button
              variant="link-danger"
              size="sm"
              onClick={handleDeactivateAuth}
              className="bg-transparent"
              disabled={deactivateLoader}
            >
              {deactivateLoader ? "Deactivating..." : "Deactivate"}
            </Button>
            <Button size="sm" onClick={handleDashboardView}>
              Import
            </Button>
          </div>
        </div>

        {/* migrations */}
        <div className="w-full h-full space-y-3 relative flex flex-col">
          <div className="relative flex items-center gap-2">
            <div className="flex-shrink-0 text-base font-medium py-2">Migrations</div>
            <Button
              size="sm"
              variant="neutral-primary"
              className="whitespace-nowrap border-none !px-1"
              onClick={handleJobsRefresh}
              disabled={loader === "re-fetch"}
            >
              <div className="relative flex items-center gap-1.5 text-xs">
                {loader === "re-fetch" ? <Loader size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                {loader === "re-fetch" && <div>Refreshing</div>}
              </div>
            </Button>
          </div>

          <div className="w-full h-full overflow-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-0 bg-custom-background-90 text-sm !font-medium text-left rounded-t">
                  <td className="p-3 whitespace-nowrap">Sr No.</td>
                  <td className="p-3 whitespace-nowrap">Plane Project</td>
                  <td className="p-3 whitespace-nowrap">Jira Workspace</td>
                  <td className="p-3 whitespace-nowrap">Jira Project</td>
                  <td className="p-3 whitespace-nowrap text-center">Status</td>
                  <td className="p-3 whitespace-nowrap text-center">Total Batches</td>
                  <td className="p-3 whitespace-nowrap text-center">Transformed Batches</td>
                  <td className="p-3 whitespace-nowrap text-center">Completed Batches</td>
                  <td className="p-3 whitespace-nowrap text-center">Re Run</td>
                  <td className="p-3 whitespace-nowrap text-center">Cancel</td>
                  <td className="p-3 whitespace-nowrap text-center">Start Time</td>
                </tr>
              </thead>
              <tbody>
                {jobIds &&
                  jobIds.length > 0 &&
                  jobIds.map((jobId, index) => {
                    const job = jobById(jobId);
                    if (!job) return null;

                    return (
                      <tr key={job.id} className="border-0 text-sm text-custom-text-200">
                        <td className="p-3 whitespace-nowrap">{index + 1}</td>
                        <td className="p-3 whitespace-nowrap">
                          <IconFieldRender
                            icon={
                              job?.config?.meta?.planeProject && job?.config?.meta?.planeProject?.logo_props ? (
                                <Logo logo={job?.config?.meta?.planeProject?.logo_props as TLogoProps} size={16} />
                              ) : (
                                <Briefcase className="w-4 h-4" />
                              )
                            }
                            title={job?.config?.meta?.planeProject?.name}
                          />
                        </td>
                        {job?.config?.meta?.resource ? (
                          <td className="p-3 whitespace-nowrap">
                            <IconFieldRender
                              icon={
                                job?.config?.meta?.resource?.avatarUrl ? (
                                  <img
                                    src={job?.config?.meta?.resource?.avatarUrl}
                                    alt={job?.config?.meta?.resource?.name}
                                    className="w-full h-full object-contain object-center"
                                  />
                                ) : (
                                  <Image src={JiraLogo} layout="fill" objectFit="contain" alt={`Jira Logo`} />
                                )
                              }
                              title={job?.config?.meta?.resource?.name}
                            />
                          </td>
                        ) : (
                          <td className="p-3 whitespace-nowrap text-center">-</td>
                        )}
                        <td className="p-3 whitespace-nowrap">
                          <IconFieldRender
                            icon={
                              <img
                                src={job?.config?.meta?.project.avatarUrls?.["48x48"]}
                                alt={job?.config?.meta?.project.name}
                                className="w-full h-full object-contain object-center"
                              />
                            }
                            title={job?.config?.meta?.project?.name}
                          />
                        </td>
                        <td className="p-3 whitespace-nowrap text-center">
                          <SyncJobStatus status={job?.status} />
                        </td>
                        <td className="p-3 whitespace-nowrap text-center">{job.total_batch_count}</td>
                        <td className="p-3 whitespace-nowrap text-center">{job.transformed_batch_count}</td>
                        <td className="p-3 whitespace-nowrap text-center">{job.completed_batch_count}</td>
                        <td className="p-3 whitespace-nowrap relative flex justify-center items-center">
                          <Button
                            variant="link-primary"
                            size="sm"
                            prependIcon={<RefreshCcw className="w-3 h-3" />}
                            onClick={() => handleRerunOpen(job.id)}
                            disabled={isReRunDisabled(job)}
                          >
                            Re Run
                          </Button>
                        </td>
                        <td className="p-3 whitespace-nowrap text-center">
                          <Button
                            variant="link-danger"
                            size="sm"
                            prependIcon={<CircleX className="w-3 h-3" />}
                            onClick={() => handleCancelOpen(job.id)}
                            disabled={isCancelDisabled(job)}
                          >
                            Cancel
                          </Button>
                        </td>
                        <td className="p-3 whitespace-nowrap text-center">
                          {job?.start_time
                            ? `${renderFormattedDate(job?.start_time)} ${renderFormattedTime(job?.start_time, "12-hour")}`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
});
