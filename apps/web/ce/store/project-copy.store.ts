/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ceProjectCopyService } from "@/plane-web/services/project-copy.service";
import type { IProjectCopyJob } from "@/plane-web/types/project-copy";

export interface IProjectCopyStore {
  activeJob: IProjectCopyJob | null;
  isModalOpen: boolean;
  openModal(): void;
  closeModal(): void;
  enqueueCopy(
    workspaceSlug: string,
    projectId: string,
    data: { target_workspace_slug: string; identifier: string; name?: string }
  ): Promise<void>;
  stopPolling(): void;
  startPolling(workspaceSlug: string, projectId: string): void;
}

export class ProjectCopyStore implements IProjectCopyStore {
  activeJob: IProjectCopyJob | null = null;
  isModalOpen = false;
  // Not observable — just a plain reference to the interval handle
  pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    makeObservable(this, {
      activeJob: observable,
      isModalOpen: observable,
      openModal: action,
      closeModal: action,
      enqueueCopy: action,
      stopPolling: action,
      startPolling: action,
    });
  }

  openModal = (): void => {
    this.isModalOpen = true;
  };

  closeModal = (): void => {
    this.isModalOpen = false;
  };

  enqueueCopy = async (
    workspaceSlug: string,
    projectId: string,
    data: { target_workspace_slug: string; identifier: string; name?: string }
  ): Promise<void> => {
    const result = await ceProjectCopyService.copyProject(workspaceSlug, projectId, data);
    runInAction(() => {
      this.activeJob = {
        job_id: result.job_id,
        status: "queued",
        new_project_id: null,
        error: null,
      };
    });
    this.startPolling(workspaceSlug, projectId);
  };

  stopPolling = (): void => {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  };

  startPolling = (workspaceSlug: string, projectId: string): void => {
    this.stopPolling();

    this.pollingInterval = setInterval(async () => {
      const jobId = this.activeJob?.job_id;
      if (!jobId) {
        this.stopPolling();
        return;
      }

      try {
        const job = await ceProjectCopyService.getCopyStatus(workspaceSlug, projectId, jobId);
        runInAction(() => {
          this.activeJob = job;
        });

        if (job.status === "completed") {
          this.stopPolling();
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Project copied successfully",
            message: "Your project has been copied to the target workspace.",
          });
        } else if (job.status === "failed") {
          this.stopPolling();
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Project copy failed",
            message: job.error ?? "An error occurred while copying the project.",
          });
        }
      } catch {
        // Network/transient error — keep polling, don't stop
      }
    }, 3000);
  };
}
