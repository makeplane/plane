/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
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
  const canPerformAdminActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT
  );

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [workspaceSlug, projectId]);

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
      <div className="w-full max-w-5xl mx-auto py-6">
        <SettingsHeading
          title="CSV Import Wizard"
          description="Bulk import your work items from a CSV file directly into Plane. Support Tickets can optionally be created automatically."
        />

        {/* Steps Breadcrumb */}
        <div className="flex items-center gap-4 my-8">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${step === "upload" ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}>
            <span>1</span> Upload CSV
          </div>
          <ArrowRight className="size-4 text-tertiary" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${step === "preview" ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}>
            <span>2</span> Preview & Validate
          </div>
          <ArrowRight className="size-4 text-tertiary" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${step === "success" ? "bg-green-500/10 border-green-500 text-green-500" : "bg-custom-background-90 border-custom-border-200 text-secondary"}`}>
            <span>3</span> Done
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition-all min-h-[300px] backdrop-blur-sm ${
                  isDragOver
                    ? "border-accent-primary bg-accent-primary/5 ring-4 ring-accent-primary/20 scale-[1.01]"
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
                    <Loader2 className="size-10 text-accent-primary animate-spin" />
                    <p className="text-sm font-medium text-primary">Validating and parsing CSV file...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-accent-primary/10 rounded-full text-accent-primary mb-4 animate-pulse">
                      <Upload className="size-8" />
                    </div>
                    <h3 className="text-base font-semibold text-primary mb-1">Drag and drop your CSV file here</h3>
                    <p className="text-xs text-tertiary mb-6">Or select from your computer (Max size: 5MB)</p>
                    <label htmlFor="csv-file-input">
                      <span className="cursor-pointer px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white text-xs font-semibold rounded-md shadow transition-colors">
                        Select CSV File
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="flex flex-col gap-6 bg-custom-background-90/80 backdrop-blur-md border border-custom-border-200/50 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Info className="size-4 text-accent-primary" /> CSV Formatting Guide
              </h4>
              <div className="text-xs text-secondary space-y-4">
                <p>Ensure your CSV file contains the following column headers for successful mapping:</p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded">title</span>
                    <span className="text-tertiary">— Work item title (Required)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">description</span>
                    <span className="text-tertiary">— Body or HTML desc (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">priority</span>
                    <span className="text-tertiary">— none, low, medium, high, urgent (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">state</span>
                    <span className="text-tertiary">— Case-insensitive state name (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">assignee, tech</span>
                    <span className="text-tertiary">— Comma-separated emails or display names (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">start date, created</span>
                    <span className="text-tertiary">— Date the issue was started or created (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">due date, target date</span>
                    <span className="text-tertiary">— Date the issue is due (Optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-secondary bg-custom-background-80 px-1 py-0.5 rounded">issue key, ticket number</span>
                    <span className="text-tertiary">— Ticket number if importing as Support Tickets (Optional)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-custom-border-200/50">
                  <p className="text-tertiary text-[11px]">Note: Invalid states are mapped automatically to the project's default state.</p>
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
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="size-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-yellow-600">CSV Parsing Warnings ({validationData.total_warnings})</h4>
                  <div className="max-h-24 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-custom-border-300">
                    {validationData.warnings.map((warn, i) => (
                      <p key={i} className="text-xs text-yellow-600/90">{warn}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Support Ticket Switch */}
            <div className="flex items-center justify-between bg-custom-background-100/50 backdrop-blur-sm border border-custom-border-200/60 p-5 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-primary">Import as Support Tickets</h4>
                <p className="text-xs text-tertiary">If enabled, a WINJIT- support ticket will be created for each imported work item.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSupportTickets}
                  onChange={(e) => setCreateSupportTickets(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-custom-background-80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-custom-border-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>

            {/* Preview Table */}
            <div className="bg-custom-background-100/50 border border-custom-border-200/60 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-custom-border-200/50 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-primary">Previewing {validationData.total_valid} valid items from <span className="font-mono text-accent-primary">{file?.name}</span></h4>
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Remove file
                </button>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-custom-background-90/80 sticky top-0 border-b border-custom-border-200 text-secondary uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Assignees</th>
                      <th className="px-5 py-3">Start Date</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Ticket #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-custom-border-100/30 text-primary">
                    {validationData.valid_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-custom-background-90/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{row.title}</td>
                        <td className="px-5 py-3.5 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            row.priority === "urgent" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            row.priority === "high" ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                            row.priority === "medium" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                            row.priority === "low" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                            "bg-custom-background-90 border-custom-border-200 text-tertiary"
                          }`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-secondary">{row.state_name || "—"}</td>
                        <td className="px-5 py-3.5 text-tertiary">
                          {row.assignee_names && row.assignee_names.length > 0 ? row.assignee_names.join(", ") : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-secondary">{row.start_date || "—"}</td>
                        <td className="px-5 py-3.5 text-secondary">{row.target_date || "—"}</td>
                        <td className="px-5 py-3.5 text-secondary font-mono">{row.ticket_number ? `#${row.ticket_number}` : "—"}</td>
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
          <div className="flex flex-col items-center justify-center border border-custom-border-200/60 bg-custom-background-100/50 rounded-xl p-12 text-center max-w-lg mx-auto shadow-md">
            <div className="p-4 bg-green-500/10 rounded-full text-green-500 mb-5 animate-bounce">
              <CheckCircle2 className="size-12" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Import Successful!</h3>
            <p className="text-sm text-secondary mb-6">
              Your work items are now imported into the project.
            </p>

            <div className="w-full bg-custom-background-90 border border-custom-border-200/50 rounded-lg p-4 mb-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Work Items Created:</span>
                <span className="font-semibold text-primary">{importResult.issues}</span>
              </div>
              {importResult.tickets > 0 && (
                <div className="flex justify-between text-sm">
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
                <Button variant="primary">
                  Go to Issues
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ImportSettingsPage);
