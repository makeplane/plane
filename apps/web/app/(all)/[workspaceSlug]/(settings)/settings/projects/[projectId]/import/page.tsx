/* eslint-disable */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Trash2, Loader2, Info } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/ui";

// components
import { PageHead } from "@/components/core/page-title";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";

// hooks & services
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { CSVImportService } from "@/services/csv-import.service";
import type { ICSVValidationResponse } from "@/services/csv-import.service";

// local imports
import type { Route } from "./+types/page";
import { ImportProjectSettingsHeader } from "./header";

const csvImportService = new CSVImportService();

function ImportSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;

  // store/permissions
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // state variables
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState<ICSVValidationResponse | null>(null);

  // confirm state
  const [isImporting, setIsImporting] = useState(false);
  const [createSupportTickets, setCreateSupportTickets] = useState(true);
  const [importResult, setImportResult] = useState<{ issues: number; tickets: number } | null>(null);

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails.name} - CSV Import` : undefined;
  const canPerformAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const processFile = async (selectedFile: File) => {
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Invalid file format",
        message: "Please upload a valid CSV file.",
      });
      return;
    }
    setFile(selectedFile);
    setIsValidating(true);
    try {
      const res = await csvImportService.validateCSV(workspaceSlug, projectId, selectedFile);
      setValidationData(res);
      setStep("preview");
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Validation Failed",
        message: err?.error || "Failed to validate CSV file.",
      });
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [workspaceSlug, projectId]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationData || validationData.valid_rows.length === 0) return;

    setIsImporting(true);
    try {
      const res = await csvImportService.confirmImport(
        workspaceSlug,
        projectId,
        validationData.valid_rows,
        createSupportTickets
      );
      setImportResult({
        issues: res.issues_created,
        tickets: res.tickets_created,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Import Complete",
        message: `Successfully imported ${res.issues_created} issues.`,
      });
      setStep("success");
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Import Failed",
        message: err?.error || "Failed to import work items.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationData(null);
    setImportResult(null);
    setStep("upload");
  };

  if (workspaceUserInfo && !canPerformAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<ImportProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="mx-auto w-full max-w-5xl py-6">
        <SettingsHeading
          title="CSV Import Wizard"
          description="Bulk import your work items from a CSV file directly into Plane. Support Tickets can optionally be created automatically."
        />

        {/* Steps Breadcrumb */}
        <div className="my-8 flex items-center gap-4">
          <div
            className={`text-xs flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${step === "upload" ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}
          >
            <span>1</span> Upload CSV
          </div>
          <ArrowRight className="size-4 text-tertiary" />
          <div
            className={`text-xs flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${step === "preview" ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}
          >
            <span>2</span> Preview & Validate
          </div>
          <ArrowRight className="size-4 text-tertiary" />
          <div
            className={`text-xs flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${step === "success" ? "bg-green-500/10 border-green-500 text-green-500" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}
          >
            <span>3</span> Done
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center backdrop-blur-sm transition-all ${
                  isDragOver
                    ? "border-accent-primary ring-accent-primary/20 scale-[1.01] bg-accent-primary/5 ring-4"
                    : "border-custom-border-200 hover:border-custom-border-300 hover:bg-custom-background-90 bg-custom-background-100/50"
                }`}
              >
                <input
                  type="file"
                  id="csv-file-input"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isValidating}
                />

                {isValidating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-10 animate-spin text-accent-primary" />
                    <p className="text-sm font-medium text-primary">Validating and parsing CSV file...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 animate-pulse rounded-full bg-accent-primary/10 p-4 text-accent-primary">
                      <Upload className="size-8" />
                    </div>
                    <h3 className="text-base mb-1 font-semibold text-primary">Drag and drop your CSV file here</h3>
                    <p className="text-xs mb-6 text-tertiary">Or select from your computer (Max size: 5MB)</p>
                    <label htmlFor="csv-file-input">
                      <span className="text-xs shadow cursor-pointer rounded-md bg-accent-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-primary-hover">
                        Select CSV File
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-custom-background-90/80 border-custom-border-200/50 shadow-sm flex flex-col gap-6 rounded-xl border p-6 backdrop-blur-md">
              <h4 className="text-sm flex items-center gap-2 font-semibold text-primary">
                <Info className="size-4 text-accent-primary" /> CSV Formatting Guide
              </h4>
              <div className="text-xs space-y-4 text-secondary">
                <p>Ensure your CSV file contains the following column headers for successful mapping:</p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-mono rounded bg-accent-primary/10 px-1 py-0.5 text-accent-primary">
                      title
                    </span>
                    <span className="text-tertiary">— Work item title (Required)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      description
                    </span>
                    <span className="text-tertiary">— Body or HTML desc (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      priority
                    </span>
                    <span className="text-tertiary">— none, low, medium, high, urgent (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">state</span>
                    <span className="text-tertiary">— Case-insensitive state name (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      assignee, tech
                    </span>
                    <span className="text-tertiary">— Comma-separated emails or display names (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      reporter
                    </span>
                    <span className="text-tertiary">— Email or display name of the reporter (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      start date, created
                    </span>
                    <span className="text-tertiary">— Date the issue was started or created (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      due date, target date
                    </span>
                    <span className="text-tertiary">— Date the issue is due (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-custom-background-80 rounded px-1 py-0.5 text-secondary">
                      issue key, ticket number
                    </span>
                    <span className="text-tertiary">— Ticket number if importing as Support Tickets (Optional)</span>
                  </div>
                </div>

                <div className="border-custom-border-200/50 border-t pt-2">
                  <p className="text-[11px] text-tertiary">
                    Note: Invalid states are mapped automatically to the project's default state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === "preview" && validationData && (
          <div className="space-y-6">
            {/* Warning Alert banner */}
            {validationData.warnings.length > 0 && (
              <div className="border-yellow-500/30 bg-yellow-500/5 flex gap-3 rounded-xl border p-4">
                <AlertTriangle className="text-yellow-500 mt-0.5 size-5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm text-yellow-600 font-semibold">
                    CSV Parsing Warnings ({validationData.total_warnings})
                  </h4>
                  <div className="scrollbar-thin scrollbar-thumb-custom-border-300 max-h-24 space-y-1 overflow-y-auto pr-2">
                    {validationData.warnings.map((warn, i) => (
                      <p key={i} className="text-xs text-yellow-600/90">
                        {warn}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Support Ticket Switch */}
            <div className="bg-custom-background-100/50 border-custom-border-200/60 flex items-center justify-between rounded-xl border p-5 backdrop-blur-sm">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-primary">Import as Support Tickets</h4>
                <p className="text-xs text-tertiary">
                  If enabled, a WINJIT- support ticket will be created for each imported work item.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={createSupportTickets}
                  onChange={(e) => setCreateSupportTickets(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="bg-custom-background-80 peer after:border-custom-border-200 h-6 w-11 rounded-full peer-checked:bg-accent-primary peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            {/* Preview Table */}
            <div className="bg-custom-background-100/50 border-custom-border-200/60 shadow-sm overflow-hidden rounded-xl border">
              <div className="border-custom-border-200/50 flex items-center justify-between border-b px-5 py-4">
                <h4 className="text-sm font-semibold text-primary">
                  Previewing {validationData.total_valid} valid items from{" "}
                  <span className="font-mono text-accent-primary">{file?.name}</span>
                </h4>
                <button
                  onClick={handleReset}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Trash2 className="size-3.5" /> Remove file
                </button>
              </div>

              <div className="max-h-[400px] overflow-x-auto">
                <table className="text-xs w-full border-collapse text-left">
                  <thead className="bg-custom-background-90/80 border-custom-border-200 sticky top-0 border-b font-semibold text-secondary uppercase">
                    <tr>
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Assignees</th>
                      <th className="px-5 py-3">Reporter</th>
                      <th className="px-5 py-3">Start Date</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Ticket #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-custom-border-100/30 divide-y text-primary">
                    {validationData.valid_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-custom-background-90/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{row.title}</td>
                        <td className="px-5 py-3.5 capitalize">
                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                              row.priority === "urgent"
                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                : row.priority === "high"
                                  ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                  : row.priority === "medium"
                                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                    : row.priority === "low"
                                      ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                      : "bg-custom-background-90 border-custom-border-200 text-tertiary"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-secondary">{row.state_name || "—"}</td>
                        <td className="px-5 py-3.5 text-tertiary">
                          {row.assignee_names && row.assignee_names.length > 0 ? row.assignee_names.join(", ") : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-tertiary">
                          {row.reporter_user_name || row.reporter_email || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-secondary">{row.start_date || "—"}</td>
                        <td className="px-5 py-3.5 text-secondary">{row.target_date || "—"}</td>
                        <td className="font-mono px-5 py-3.5 text-secondary">
                          {row.ticket_number ? `#${row.ticket_number}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="neutral-primary" onClick={handleReset}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmImport} loading={isImporting}>
                Import {validationData.total_valid} items
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "success" && importResult && (
          <div className="border-custom-border-200/60 bg-custom-background-100/50 shadow-md mx-auto flex max-w-lg flex-col items-center justify-center rounded-xl border p-12 text-center">
            <div className="bg-green-500/10 text-green-500 mb-5 animate-bounce rounded-full p-4">
              <CheckCircle2 className="size-12" />
            </div>
            <h3 className="text-xl mb-2 font-bold text-primary">Import Successful!</h3>
            <p className="text-sm mb-6 text-secondary">Your work items are now imported into the project.</p>

            <div className="bg-custom-background-90 border-custom-border-200/50 mb-8 w-full space-y-2 rounded-lg border p-4">
              <div className="text-sm flex justify-between">
                <span className="text-secondary">Work Items Created:</span>
                <span className="font-semibold text-primary">{importResult.issues}</span>
              </div>
              {importResult.tickets > 0 && (
                <div className="text-sm flex justify-between">
                  <span className="text-secondary">Support Tickets Created:</span>
                  <span className="font-semibold text-primary">{importResult.tickets}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="neutral-primary" onClick={handleReset}>
                Import Another File
              </Button>
              <a href={`/${workspaceSlug}/projects/${projectId}/issues`}>
                <Button variant="primary">Go to Issues</Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ImportSettingsPage);
