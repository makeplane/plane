/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Contract peek: same panel modes as the work-item peek overview
 * (side-peek / modal / full-screen, rendered through the full-screen portal).
 * Desktop splits document + tabs; mobile is single-focus — one top-level tab
 * set (document, info, process, chat) where each view takes the whole panel.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, RefreshCcw, Sparkles, X } from "lucide-react";
import useSWR from "swr";
// plane imports
import { PDFViewer } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TContract, TContractJob, TContractRetryOptions, TContractUpdatePayload } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { contractService } from "@/services/contract.service";
import { fileLibraryService } from "@/services/file-library.service";
// local imports
import { ContractChatPanel } from "./chat/chat-panel";
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, YES_NO_UNSPECIFIED_OPTIONS } from "./constants";
import { ProcessingBadge } from "./processing-badge";
import { RetryOptionsModal } from "./retry-options-modal";

type Props = {
  workspaceSlug: string;
  contractId: string;
  onClose: () => void;
  /** Called after any action that changes the list row (save, retry, confirm) */
  onMutate: () => void;
};

type TPeekModes = "side-peek" | "modal" | "full-screen";
/** "document" is mobile-only (desktop always shows the PDF beside the tabs) */
type Tab = "document" | "info" | "process" | "chat";

const PEEK_OPTIONS: { key: TPeekModes; icon: typeof SidePanelIcon; i18nKey: string }[] = [
  { key: "side-peek", icon: SidePanelIcon, i18nKey: "common.side_peek" },
  { key: "modal", icon: CenterPanelIcon, i18nKey: "common.modal" },
  { key: "full-screen", icon: FullScreenPanelIcon, i18nKey: "common.full_screen" },
];

const EDITABLE_TEXT_FIELDS: { key: keyof TContractUpdatePayload; i18nKey: string; textarea?: boolean }[] = [
  { key: "titulo", i18nKey: "file_library.contracts.fields.titulo" },
  { key: "resumen_general", i18nKey: "file_library.contracts.fields.resumen_general", textarea: true },
  { key: "nombre_grupo", i18nKey: "file_library.contracts.fields.nombre_grupo" },
  { key: "artistas", i18nKey: "file_library.contracts.fields.artistas" },
  { key: "testigos", i18nKey: "file_library.contracts.fields.testigos" },
  { key: "involucrados", i18nKey: "file_library.contracts.fields.involucrados" },
  { key: "tiempo_extension_posible", i18nKey: "file_library.contracts.fields.tiempo_extension_posible" },
  { key: "expansion_time_description", i18nKey: "file_library.contracts.fields.expansion_time_description", textarea: true },
  { key: "collection_period_description", i18nKey: "file_library.contracts.fields.collection_period_description" },
  { key: "collection_period_duration", i18nKey: "file_library.contracts.fields.collection_period_duration" },
  { key: "retention_period_description", i18nKey: "file_library.contracts.fields.retention_period_description" },
  { key: "retention_period_duration", i18nKey: "file_library.contracts.fields.retention_period_duration" },
];

const DATE_FIELDS: { key: keyof TContractUpdatePayload; i18nKey: string }[] = [
  { key: "fecha_inicio", i18nKey: "file_library.contracts.fields.fecha_inicio" },
  { key: "fecha_fin", i18nKey: "file_library.contracts.fields.fecha_fin" },
  { key: "fecha_fin_efectiva", i18nKey: "file_library.contracts.fields.fecha_fin_efectiva" },
];

const SELECT_FIELDS: { key: keyof TContractUpdatePayload; i18nKey: string; options: { value: string; i18nKey: string }[] }[] = [
  { key: "estatus_contrato", i18nKey: "file_library.contracts.fields.estatus_contrato", options: CONTRACT_STATUS_OPTIONS },
  { key: "tipo_contrato", i18nKey: "file_library.contracts.fields.tipo_contrato", options: CONTRACT_TYPE_OPTIONS },
  {
    key: "es_posible_expandirlo",
    i18nKey: "file_library.contracts.fields.es_posible_expandirlo",
    options: YES_NO_UNSPECIFIED_OPTIONS,
  },
  { key: "periodo_coleccion", i18nKey: "file_library.contracts.fields.periodo_coleccion", options: YES_NO_UNSPECIFIED_OPTIONS },
  { key: "periodo_retencion", i18nKey: "file_library.contracts.fields.periodo_retencion", options: YES_NO_UNSPECIFIED_OPTIONS },
];

export function ContractPeekPanel(props: Props) {
  const { workspaceSlug, contractId, onClose, onMutate } = props;
  const { t } = useTranslation();
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const [tab, setTab] = useState<Tab>("document");
  const [draft, setDraft] = useState<TContractUpdatePayload>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // On desktop the PDF is always visible, so "document" behaves as "info"
  const paneTab: Exclude<Tab, "document"> = tab === "document" ? "info" : tab;

  // contract detail
  const {
    data: contract,
    mutate: mutateContract,
    isLoading,
  } = useSWR(`CONTRACT_DETAIL_${contractId}`, () => contractService.getContract(workspaceSlug, contractId), {
    revalidateOnFocus: false,
  });

  // jobs for this contract — poll fast while one is active
  const { data: jobs, mutate: mutateJobs } = useSWR(
    `CONTRACT_JOBS_${contractId}`,
    () => contractService.getJobs(workspaceSlug, { contractId }),
    { refreshInterval: (latest) => (latest?.some((job) => job.status === "QUEUED" || job.status === "RUNNING") ? 2000 : 0) }
  );
  const activeJob = jobs?.find((job) => job.status === "QUEUED" || job.status === "RUNNING");

  // refresh detail + list when a run finishes
  const activeJobId = activeJob?.id;
  useEffect(() => {
    if (!activeJobId) {
      void mutateContract();
      onMutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobId]);

  // Escape closes (matches the work-item peek behavior)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // PDF presigned URL
  useEffect(() => {
    let cancelled = false;
    setPdfUrl(null);
    if (!contract?.file_asset_id) return;
    fileLibraryService
      .getPresignedViewUrl(workspaceSlug, contract.file_asset_id)
      .then((url) => {
        if (!cancelled) setPdfUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, contract?.file_asset_id]);

  // reset the form when the contract payload changes
  useEffect(() => {
    setDraft({});
  }, [contract?.updated_at, contractId]);

  const draftValue = <K extends keyof TContractUpdatePayload>(key: K) =>
    (key in draft ? draft[key] : contract?.[key]) as TContractUpdatePayload[K];
  const isDirty = Object.keys(draft).length > 0;

  const handleSave = async () => {
    if (!contract || !isDirty) return;
    setIsSaving(true);
    try {
      const updated = await contractService.updateContract(workspaceSlug, contract.id, draft);
      await mutateContract(updated, { revalidate: false });
      setDraft({});
      onMutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("file_library.contracts.save_success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.save_failed") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async (options: TContractRetryOptions) => {
    if (!contract) return;
    setIsActing(true);
    try {
      await contractService.retryContract(workspaceSlug, contract.id, options);
      await Promise.all([mutateJobs(), mutateContract()]);
      onMutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("file_library.contracts.retry.started") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.retry.failed") });
    } finally {
      setIsActing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!contract) return;
    setIsActing(true);
    try {
      await contractService.reanalyzeContract(workspaceSlug, contract.id);
      await Promise.all([mutateJobs(), mutateContract()]);
      onMutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("file_library.contracts.reanalyze.started") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.reanalyze.failed") });
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmProposed = async (accept: boolean) => {
    if (!contract) return;
    setIsActing(true);
    try {
      const updated = await contractService.confirmReanalysis(workspaceSlug, contract.id, accept);
      await mutateContract(updated, { revalidate: false });
      onMutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: accept
          ? t("file_library.contracts.reanalyze.applied")
          : t("file_library.contracts.reanalyze.discarded"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.reanalyze.failed") });
    } finally {
      setIsActing(false);
    }
  };

  const proposedEntries = useMemo(
    () => Object.entries(contract?.proposed_data ?? {}).filter(([, value]) => value !== null && value !== ""),
    [contract?.proposed_data]
  );

  const inputClass = "w-full rounded-sm border border-subtle bg-transparent px-2 py-1 text-13";

  const pdfViewer = pdfUrl ? (
    <PDFViewer src={pdfUrl} fileName={contract?.file_name ?? "contract.pdf"} className="h-full" showUpload={false} />
  ) : (
    <div className="flex h-full items-center justify-center text-tertiary">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );

  const infoPane = (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {SELECT_FIELDS.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span className="text-11 font-medium text-tertiary">{t(field.i18nKey)}</span>
          <select
            value={(draftValue(field.key) as string | null) ?? ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value || null }))}
            className={inputClass}
          >
            <option value="">—</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.i18nKey)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={!!draftValue("es_notariado")}
          onChange={(e) => setDraft((prev) => ({ ...prev, es_notariado: e.target.checked }))}
        />
        <span className="text-13">{t("file_library.contracts.fields.es_notariado")}</span>
      </label>
      {DATE_FIELDS.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span className="text-11 font-medium text-tertiary">{t(field.i18nKey)}</span>
          <input
            type="date"
            value={(draftValue(field.key) as string | null) ?? ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value || null }))}
            className={inputClass}
          />
        </label>
      ))}
      {EDITABLE_TEXT_FIELDS.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span className="text-11 font-medium text-tertiary">{t(field.i18nKey)}</span>
          {field.textarea ? (
            <textarea
              rows={3}
              value={(draftValue(field.key) as string | null) ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value || null }))}
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              value={(draftValue(field.key) as string | null) ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value || null }))}
              className={inputClass}
            />
          )}
        </label>
      ))}
      {contract?.ai_model_used && (
        <p className="text-11 text-tertiary">{t("file_library.contracts.ai_model", { model: contract.ai_model_used })}</p>
      )}
    </div>
  );

  const processPane = (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      <div className="rounded-md border border-subtle p-3 text-12">
        <p className="font-medium">{t("file_library.contracts.process.pipeline_state")}</p>
        <p className="mt-1 text-tertiary">
          {contract?.text_extracted_at
            ? t("file_library.contracts.process.text_extracted", {
                date: new Date(contract.text_extracted_at).toLocaleString(),
              })
            : t("file_library.contracts.process.text_pending")}
        </p>
        {contract?.processed_at && (
          <p className="text-tertiary">
            {t("file_library.contracts.process.analyzed", { date: new Date(contract.processed_at).toLocaleString() })}
          </p>
        )}
      </div>
      {(jobs ?? []).length === 0 ? (
        <p className="text-12 text-tertiary">{t("file_library.contracts.process.no_jobs")}</p>
      ) : (
        (jobs ?? []).map((job) => <JobCard key={job.id} job={job} />)
      )}
    </div>
  );

  const chatPane = contract ? (
    <div className="min-h-0 flex-1">
      <ContractChatPanel workspaceSlug={workspaceSlug} mode="CONTRACT" contractId={contract.id} compact />
    </div>
  ) : null;

  const loaderPane = (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-tertiary" />
    </div>
  );

  const saveBar = paneTab === "info" && isDirty && (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-subtle px-4 py-2.5">
      <Button variant="secondary" size="sm" onClick={() => setDraft({})} disabled={isSaving}>
        {t("cancel")}
      </Button>
      <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : t("file_library.contracts.save")}
      </Button>
    </div>
  );

  const tabButton = (key: Tab, extraClass = "") => (
    <button
      key={key}
      type="button"
      onClick={() => setTab(key)}
      disabled={key === "chat" && !contract?.text_extracted_at}
      className={cn(
        "rounded-t-sm border-b-2 px-3 py-1.5 text-12 font-medium disabled:opacity-40",
        (key === "document" ? tab === "document" : paneTab === key && tab !== "document")
          ? "border-accent-strong text-accent-primary"
          : "border-transparent text-tertiary hover:text-secondary",
        extraClass
      )}
    >
      {t(`file_library.contracts.tabs.${key}`)}
    </button>
  );

  const panelClassName = cn(
    "absolute z-[25] flex flex-col overflow-hidden rounded-sm border border-subtle bg-surface-1 transition-all duration-300",
    {
      // Wider sheet than the work-item peek so the document + data read comfortably
      "top-0 right-0 bottom-0 w-full border-0 border-l lg:w-[80%] xl:w-[72%]": peekMode === "side-peek",
      "top-[8.33%] left-[8.33%] size-5/6 max-lg:top-0 max-lg:left-0 max-lg:size-full": peekMode === "modal",
      "inset-0 lg:m-4": peekMode === "full-screen",
    }
  );

  const portalContainer = typeof document !== "undefined" ? document.getElementById("full-screen-portal") : null;

  const content = (
    <div className="absolute inset-0 z-[24]">
      {/* backdrop */}
      <button type="button" className="absolute inset-0 bg-black/20" onClick={onClose} aria-label={t("close")} />
      <div
        className={panelClassName}
        style={{
          boxShadow:
            "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
        }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* peek mode switcher (desktop) */}
            <div className="hidden items-center gap-0.5 rounded-md border border-subtle p-0.5 lg:flex">
              {PEEK_OPTIONS.map((option) => (
                <Tooltip key={option.key} tooltipContent={t(option.i18nKey)}>
                  <button
                    type="button"
                    onClick={() => setPeekMode(option.key)}
                    className={cn(
                      "rounded-sm p-1",
                      peekMode === option.key ? "bg-layer-1 text-primary" : "text-tertiary hover:bg-layer-1-hover"
                    )}
                  >
                    <option.icon className="size-3.5" />
                  </button>
                </Tooltip>
              ))}
            </div>
            <span className="truncate text-14 font-medium">
              {contract?.titulo ?? contract?.file_name ?? t("file_library.contracts.title")}
            </span>
            {contract && <ProcessingBadge contract={contract} activeJob={activeJob} />}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Retry: opens the shared full-or-partial options dialog */}
            <button
              type="button"
              onClick={() => setIsRetryModalOpen(true)}
              disabled={isActing || !!activeJob}
              className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-12 hover:bg-layer-1-hover disabled:opacity-50"
              title={t("file_library.contracts.retry.hint")}
            >
              <RefreshCcw className="size-3.5" />
              <span className="hidden sm:inline">{t("file_library.contracts.retry.button")}</span>
            </button>
            {/* Reanalyze (proposes, doesn't overwrite) */}
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={isActing || !!activeJob || !contract?.text_extracted_at}
              className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-12 hover:bg-layer-1-hover disabled:opacity-50"
              title={t("file_library.contracts.reanalyze.hint")}
            >
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">{t("file_library.contracts.reanalyze.button")}</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-sm p-1.5 hover:bg-layer-1-hover">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* proposed data confirmation banner */}
        {contract?.proposed_data && proposedEntries.length > 0 && (
          <div className="shrink-0 border-b border-subtle bg-accent-primary/5 px-4 py-2.5">
            <p className="text-12 font-medium">{t("file_library.contracts.reanalyze.pending_title")}</p>
            <div className="mt-1 max-h-28 overflow-y-auto rounded-sm border border-subtle bg-surface-1 p-2 text-11">
              {proposedEntries.map(([key, value]) => (
                <p key={key} className="truncate">
                  <span className="font-medium">{key}:</span>{" "}
                  {Array.isArray(value)
                    ? value.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))).join(", ")
                    : String(value)}
                </p>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => handleConfirmProposed(true)} disabled={isActing}>
                {t("file_library.contracts.reanalyze.accept")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleConfirmProposed(false)} disabled={isActing}>
                {t("file_library.contracts.reanalyze.discard")}
              </Button>
            </div>
          </div>
        )}

        {/* ── Mobile: single-focus views behind top-level tabs ─────────── */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-subtle px-3 pt-2">
            {(["document", "info", "process", "chat"] as Tab[]).map((key) => tabButton(key))}
          </div>
          {tab === "document" ? (
            <div className="min-h-0 flex-1">{pdfViewer}</div>
          ) : isLoading || !contract ? (
            loaderPane
          ) : tab === "chat" ? (
            chatPane
          ) : tab === "process" ? (
            processPane
          ) : (
            infoPane
          )}
          {tab !== "document" && saveBar}
        </div>

        <RetryOptionsModal
          isOpen={isRetryModalOpen}
          onClose={() => setIsRetryModalOpen(false)}
          onConfirm={handleRetry}
        />

        {/* ── Desktop: document beside the tabbed pane ─────────────────── */}
        <div className="hidden min-h-0 flex-1 lg:flex">
          <div className="min-h-0 w-1/2 border-r border-subtle">{pdfViewer}</div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1 border-b border-subtle px-3 pt-2">
              {(["info", "process", "chat"] as Tab[]).map((key) => tabButton(key))}
            </div>
            {isLoading || !contract ? (
              loaderPane
            ) : paneTab === "chat" ? (
              chatPane
            ) : paneTab === "process" ? (
              processPane
            ) : (
              infoPane
            )}
            {saveBar}
          </div>
        </div>
      </div>
    </div>
  );

  return portalContainer ? createPortal(content, portalContainer) : content;
}

function JobCard({ job }: { job: TContractJob }) {
  const { t } = useTranslation();
  const isActive = job.status === "QUEUED" || job.status === "RUNNING";
  return (
    <div className="rounded-md border border-subtle p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-12 font-medium">
          {t(`file_library.contracts.task_type.${job.task_type.toLowerCase()}`)}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium",
            isActive
              ? "bg-accent-primary/10 text-accent-primary"
              : job.status === "COMPLETED"
                ? "bg-success-subtle text-success-primary"
                : "bg-danger-subtle text-danger-primary"
          )}
        >
          {isActive && <Loader2 className="size-3 animate-spin" />}
          {job.status === "FAILED" && <AlertTriangle className="size-3" />}
          {t(`file_library.contracts.job_status.${job.status.toLowerCase()}`)}
        </span>
      </div>
      {/* progress bar + current stage */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-layer-1">
        <div
          className={cn("h-full rounded-full transition-all", job.status === "FAILED" ? "bg-danger-strong" : "bg-accent-primary")}
          style={{ width: `${job.progress}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-11 text-tertiary">
        <span className="truncate">{job.current_stage ?? "—"}</span>
        <span className="shrink-0 tabular-nums">{job.progress}%</span>
      </div>
      {job.error?.message && (
        <p className="mt-1.5 rounded-sm bg-danger-subtle px-2 py-1 text-11 text-danger-primary">
          {job.error.stage ? `[${job.error.stage}] ` : ""}
          {job.error.message}
        </p>
      )}
      <p className="mt-1.5 text-10 text-tertiary">{new Date(job.created_at).toLocaleString()}</p>
    </div>
  );
}
