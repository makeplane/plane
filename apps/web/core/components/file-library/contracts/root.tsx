/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TContract, TContractFilters, TContractJob } from "@plane/types";
// services
import { contractService } from "@/services/contract.service";
// local imports
import { AppliedContractFilters, ContractFiltersDropdown } from "./filters";
import { ContractPeekPanel } from "./peek-panel";
import { ContractQueryModal } from "./query-modal";
import { ContractsTable } from "./table";

type Props = {
  workspaceSlug: string;
};

export function ContractsRoot(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  // states
  const [filters, setFiltersState] = useState<TContractFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  const setFilters = (next: Partial<TContractFilters>) => setFiltersState((prev) => ({ ...prev, ...next }));

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

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("file_library.contracts.search_placeholder")}
              className="w-44 rounded-md border border-subtle bg-transparent py-1.5 pl-8 pr-2 text-12 sm:w-64"
            />
          </div>
          <ContractFiltersDropdown filters={filters} onChange={setFilters} />
        </div>
        <div className="flex items-center gap-2">
          {(activeJobs?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-2.5 py-1 text-11 font-medium text-accent-primary">
              <Loader2 className="size-3 animate-spin" />
              {t("file_library.contracts.active_jobs", { count: activeJobs?.length ?? 0 })}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setIsQueryModalOpen(true)}>
            <Sparkles className="size-3.5" />
            {t("file_library.contracts.query.button")}
          </Button>
        </div>
      </div>

      {/* applied filter pills */}
      <AppliedContractFilters filters={filters} onChange={setFilters} onClearAll={() => setFiltersState({})} />

      {/* table */}
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

      <ContractQueryModal
        workspaceSlug={workspaceSlug}
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </div>
  );
}
