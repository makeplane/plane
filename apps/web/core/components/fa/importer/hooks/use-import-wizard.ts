// [FA-CUSTOM] Import wizard state management hook
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ImportService } from "@/services/import.service";
import type { TImportJob, TUploadResponse } from "@/services/import.service";

export type ImportWizardStep =
  | "upload"
  | "column_mapping"
  | "status_mapping"
  | "assignee_mapping"
  | "review"
  | "progress"
  | "results";

export type UseImportWizardReturn = ReturnType<typeof useImportWizard>;

type ErrorLike = { error?: string; message?: string };

function getErrorMessage(e: unknown, fallback: string): string {
  const err = e as ErrorLike;
  return err?.error || err?.message || fallback;
}

export function useImportWizard(workspaceSlug: string, projectId: string) {
  const importService = useMemo(() => new ImportService(), []);

  const [step, setStep] = useState<ImportWizardStep>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from upload response
  const [uploadData, setUploadData] = useState<TUploadResponse | null>(null);

  // User-editable mappings
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({});
  const [assigneeMapping, setAssigneeMapping] = useState<Record<string, string>>({});

  // Import job for tracking
  const [importJob, setImportJob] = useState<TImportJob | null>(null);

  // Polling interval ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(
    (token: string) => {
      pollRef.current = setInterval(() => {
        void importService
          .getImportJob(workspaceSlug, projectId, token)
          .then((job) => {
            setImportJob(job);
            if (["completed", "completed_with_errors", "failed"].includes(job.status)) {
              if (pollRef.current) clearInterval(pollRef.current);
              setStep("results");
            }
            return undefined;
          })
          .catch(() => {
            // silently retry on next interval
          });
      }, 2000);
    },
    [workspaceSlug, projectId, importService]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await importService.uploadFile(workspaceSlug, projectId, file);
        setUploadData(data);
        setColumnMapping(data.column_mapping);

        // Pre-populate status mapping from high-confidence fuzzy suggestions
        const autoStatusMap: Record<string, string> = {};
        for (const [statusValue, suggestion] of Object.entries(data.status_suggestions)) {
          if (suggestion.confidence >= 0.6) {
            autoStatusMap[statusValue] = suggestion.state_id;
          }
        }
        setStatusMapping(autoStatusMap);

        // Pre-populate assignee mapping from high-confidence suggestions
        const autoAssigneeMap: Record<string, string> = {};
        for (const [assignee, suggestion] of Object.entries(data.assignee_suggestions)) {
          if (suggestion.confidence >= 0.7) {
            autoAssigneeMap[assignee] = suggestion.user_id;
          }
        }
        setAssigneeMapping(autoAssigneeMap);

        setStep("column_mapping");
      } catch (e: unknown) {
        const msg = getErrorMessage(e, "Upload failed");
        setError(msg);
        setToast({ type: TOAST_TYPE.ERROR, title: "Upload Error", message: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceSlug, projectId, importService]
  );

  const saveAndAdvance = useCallback(
    async (nextStep: ImportWizardStep) => {
      if (!uploadData) return;
      setIsLoading(true);
      setError(null);
      try {
        await importService.updateMapping(workspaceSlug, projectId, uploadData.token, {
          column_mapping: columnMapping,
          status_mapping: statusMapping,
          assignee_mapping: assigneeMapping,
        });
        setStep(nextStep);
      } catch (e: unknown) {
        const msg = getErrorMessage(e, "Failed to save mapping");
        setError(msg);
        setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [uploadData, columnMapping, statusMapping, assigneeMapping, workspaceSlug, projectId, importService]
  );

  const startImport = useCallback(async () => {
    if (!uploadData) return;
    setIsLoading(true);
    setError(null);
    try {
      // Save final mappings
      await importService.updateMapping(workspaceSlug, projectId, uploadData.token, {
        column_mapping: columnMapping,
        status_mapping: statusMapping,
        assignee_mapping: assigneeMapping,
      });
      // Trigger the import
      await importService.startImport(workspaceSlug, projectId, uploadData.token);
      setStep("progress");
      startPolling(uploadData.token);
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "Failed to start import");
      setError(msg);
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [
    uploadData,
    columnMapping,
    statusMapping,
    assigneeMapping,
    workspaceSlug,
    projectId,
    importService,
    startPolling,
  ]);

  // Cleanup polling on unmount
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    []
  );

  return {
    step,
    setStep,
    isLoading,
    error,
    uploadData,
    columnMapping,
    setColumnMapping,
    statusMapping,
    setStatusMapping,
    assigneeMapping,
    setAssigneeMapping,
    importJob,
    uploadFile,
    saveAndAdvance,
    startImport,
  };
}
