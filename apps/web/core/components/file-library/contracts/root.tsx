/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Layers, Loader2, MessageSquare, RefreshCcw, Search, Sparkles, X } from "lucide-react";
import { useSearchParams } from "react-router";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContract, TContractFilters, TContractJob, TContractRetryOptions } from "@plane/types";
// services
import { contractService } from "@/services/contract.service";
// local imports
import { BulkActionsModal } from "../bulk-actions-modal";
import { downloadAssets } from "../download";
// local imports
import { ContractChatModal } from "./chat/chat-modal";
import { AppliedContractFilters, ContractFiltersDropdown } from "./filters";
import { ContractPeekPanel } from "./peek-panel";
import { ContractQueryModal } from "./query-modal";
import { RetryOptionsModal } from "./retry-options-modal";
import { ContractsTable } from "./table";

type Props = {
  workspaceSlug: string;
};

export function ContractsRoot(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // states
  const [filters, setFiltersState] = useState<TContractFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [isBulkRetryModalOpen, setIsBulkRetryModalOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);

  const setFilters = (next: Partial<TContractFilters>) => setFiltersState((prev) => ({ ...prev, ...next }));

  // deep links: ?peek=<contract_id> (chat sources) and ?chat=<query> (Power K AI search)
  useEffect(() => {
    const peek = searchParams.get("peek");
    const chatQuery = searchParams.get("chat");
    if (peek) setSelectedContractId(peek);
    if (chatQuery !== null) {
      setChatInitialQuery(chatQuery || undefined);
      setIsChatOpen(true);
    }
    if (peek || chatQuery !== null) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // debounce search → server-side filter
  useEffect(() => {
    const handle = setTimeout(() => setFilters({ search: searchInput.trim() || undefined }), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // contracts, refetched from the database on every filter change
  const filtersKey = JSON.stringify(filters);
  const {
    data: contracts,
    mutate: mutateContracts,
    isLoading,
  } = useSWR<TContract[]>(
    `CONTRACTS_${workspaceSlug}_${filtersKey}`,
    () => contractService.getContracts(workspaceSlug, filters),
    { revalidateOnFocus: false }
  );

  // live pipeline monitoring: poll active jobs, refresh the table when a run ends
  const { data: activeJobs } = useSWR<TContractJob[]>(
    `CONTRACT_ACTIVE_JOBS_${workspaceSlug}`,
    () => contractService.getJobs(workspaceSlug, { active: true }),
    { refreshInterval: (latest) => ((latest?.length ?? 0) > 0 ? 2000 : 15000) }
  );
  const activeJobsByContract = useMemo(() => {
    const map: Record<string, TContractJob> = {};
    (activeJobs ?? []).forEach((job) => {
      if (job.contract_id && !map[job.contract_id]) map[job.contract_id] = job;
    });
    return map;
  }, [activeJobs]);

  const previousActiveCount = useRef(0);
  useEffect(() => {
    const count = activeJobs?.length ?? 0;
    if (previousActiveCount.current > 0 && count < previousActiveCount.current) void mutateContracts();
    previousActiveCount.current = count;
  }, [activeJobs?.length, mutateContracts]);

  // bulk actions
  const toggleSelect = (contractId: string) =>
    setSelectedIds((previous) =>
      previous.includes(contractId) ? previous.filter((id) => id !== contractId) : [...previous, contractId]
    );
  const toggleSelectAll = () =>
    setSelectedIds((previous) =>
      previous.length === (contracts ?? []).length ? [] : (contracts ?? []).map((c) => c.id)
    );

  // The Files bulk-actions modal (move/categories/tags/delete) operates on
  // file_asset ids, not contract ids — map the selection across
  const selectedFileAssetIds = (contracts ?? [])
    .filter((contract) => selectedIds.includes(contract.id))
    .map((contract) => contract.file_asset_id)
    .filter((id): id is string => !!id);

  // Downloads the contracts' backing documents: one file directly, several
  // bundled into a ZIP. Callers pass the filtered list or the selection.
  const downloadContractFiles = async (contractsToDownload: TContract[]) => {
    const targets = contractsToDownload
      .filter((contract): contract is TContract & { file_asset_id: string } => !!contract.file_asset_id)
      .map((contract) => ({
        assetId: contract.file_asset_id,
        name: contract.file_name ?? `${contract.titulo ?? contract.id}.pdf`,
      }));
    if (targets.length === 0) return;
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("file_library.download_started", { count: targets.length }),
    });
    try {
      await downloadAssets(workspaceSlug, targets, "contratos");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.download_failed") });
    }
  };

  const handleBulk = async (action: "retry" | "reanalyze", retryOptions?: TContractRetryOptions) => {
    if (selectedIds.length === 0 || isBulkActing) return;
    setIsBulkActing(true);
    try {
      const { dispatched, skipped } = await contractService.bulkAction(
        workspaceSlug,
        action,
        selectedIds,
        retryOptions
      );
      setSelectedIds([]);
      void mutateContracts();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("file_library.contracts.bulk.dispatched", { count: dispatched.length, skipped: skipped.length }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.bulk.failed") });
    } finally {
      setIsBulkActing(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-subtle px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("file_library.contracts.search_placeholder")}
              className="w-36 rounded-md border border-subtle bg-transparent py-1.5 pr-2 pl-8 text-12 sm:w-64"
            />
          </div>
          <ContractFiltersDropdown workspaceSlug={workspaceSlug} filters={filters} onChange={setFilters} />
          {/* contextual download: every contract matching the current filters */}
          <button
            type="button"
            onClick={() => void downloadContractFiles(contracts ?? [])}
            disabled={(contracts ?? []).length === 0}
            title={t("file_library.download_all_hint")}
            className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1.5 text-12 hover:bg-layer-1-hover disabled:opacity-50"
          >
            <Download className="size-3.5" />
            <span className="hidden lg:inline">{t("file_library.download_all")}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(activeJobs?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-2.5 py-1 text-11 font-medium text-accent-primary">
              <Loader2 className="size-3 animate-spin" />
              <span className="hidden sm:inline">
                {t("file_library.contracts.active_jobs", { count: activeJobs?.length ?? 0 })}
              </span>
              <span className="sm:hidden">{activeJobs?.length ?? 0}</span>
            </span>
          )}
          <Button variant="primary" size="sm" onClick={() => setIsChatOpen(true)}>
            <MessageSquare className="size-3.5" />
            <span className="hidden sm:inline">{t("file_library.contracts.chat.button")}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsQueryModalOpen(true)}>
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">{t("file_library.contracts.query.button")}</span>
          </Button>
        </div>
      </div>

      {/* applied filter pills */}
      <AppliedContractFilters
        workspaceSlug={workspaceSlug}
        filters={filters}
        onChange={setFilters}
        onClearAll={() => setFiltersState({})}
      />

      {/* bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-subtle bg-layer-1 px-3 py-2 sm:px-4">
          <span className="text-12 font-medium">
            {t("file_library.contracts.bulk.selected", { count: selectedIds.length })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setIsBulkRetryModalOpen(true)} disabled={isBulkActing}>
            <RefreshCcw className="size-3.5" />
            {t("file_library.contracts.retry.button")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleBulk("reanalyze")} disabled={isBulkActing}>
            <Sparkles className="size-3.5" />
            {t("file_library.contracts.reanalyze.button")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              void downloadContractFiles((contracts ?? []).filter((contract) => selectedIds.includes(contract.id)))
            }
          >
            <Download className="size-3.5" />
            {t("file_library.download_selected")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBulkActionsModalOpen(true)}
            disabled={selectedFileAssetIds.length === 0}
          >
            <Layers className="size-3.5" />
            {t("file_library.bulk.button")}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="flex items-center gap-1 rounded-sm px-2 py-1 text-12 text-tertiary hover:bg-layer-1-hover"
          >
            <X className="size-3.5" />
            {t("file_library.contracts.bulk.clear")}
          </button>
        </div>
      )}

      {/* table (desktop) / cards (mobile) */}
      <div className="min-h-0 flex-1">
        {isLoading && !contracts ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-tertiary" />
          </div>
        ) : (
          <ContractsTable
            contracts={contracts ?? []}
            activeJobsByContract={activeJobsByContract}
            selectedContractId={selectedContractId}
            onSelect={(contract) => setSelectedContractId(contract.id)}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        )}
      </div>

      {/* peek panel */}
      {selectedContractId && (
        <ContractPeekPanel
          workspaceSlug={workspaceSlug}
          contractId={selectedContractId}
          onClose={() => setSelectedContractId(null)}
          onMutate={() => void mutateContracts()}
        />
      )}

      <ContractChatModal
        workspaceSlug={workspaceSlug}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialQuery(undefined);
        }}
        initialQuery={chatInitialQuery}
      />
      <ContractQueryModal
        workspaceSlug={workspaceSlug}
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
      <RetryOptionsModal
        isOpen={isBulkRetryModalOpen}
        onClose={() => setIsBulkRetryModalOpen(false)}
        onConfirm={(options) => handleBulk("retry", options)}
        count={selectedIds.length}
      />
      <BulkActionsModal
        workspaceSlug={workspaceSlug}
        isOpen={isBulkActionsModalOpen}
        onClose={() => {
          setIsBulkActionsModalOpen(false);
          setSelectedIds([]);
          void mutateContracts();
        }}
        initialFileIds={selectedFileAssetIds}
      />
    </div>
  );
}
