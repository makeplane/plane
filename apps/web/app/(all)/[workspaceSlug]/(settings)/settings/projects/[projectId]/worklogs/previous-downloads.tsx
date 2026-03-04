/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Collapsible, Table } from "@plane/ui";

import { WorklogPaginationFooter } from "./worklog-pagination-footer";
import type { IExporterHistory } from "../../../../../../ce/types/worklog-export";

interface IPreviousDownloadsProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ExportColumn {
  key: string;
  label: string;
  width: string;
  render: (row: any) => JSX.Element | string | null;
}

const getExportColumns = (): ExportColumn[] => [
  {
    key: "status",
    label: "Status",
    width: "120px",
    render: (row: any) => {
      const status = row.status as string;
      return (
        <span className="text-xs">
          {status === "completed" ? "Ready" : status === "processing" ? "Processing" : "Failed"}
        </span>
      );
    },
  },
  {
    key: "created_at",
    label: "Created",
    width: "150px",
    render: (row: any) => {
      const createdAt = row.created_at as string;
      return new Date(createdAt).toLocaleDateString();
    },
  },
  {
    key: "actions",
    label: "Actions",
    width: "100px",
    render: () => null,
  },
];

function PreviousDownloadsComponent({ isOpen, onToggle }: IPreviousDownloadsProps) {
  const { workspaceSlug, projectId } = useParams<{
    workspaceSlug: string;
    projectId: string;
  }>();

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<IExporterHistory[]>([]);
  const [paginationMeta, setPaginationMeta] = useState({
    hasNext: false,
    hasPrev: false,
    nextCursor: null as string | null,
    prevCursor: null as string | null,
    totalCount: 0,
  });

  const fetchHistory = useCallback(
    async (cursor?: string | null): Promise<void> => {
      if (!projectId || !workspaceSlug) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ per_page: "10" });
        if (cursor) params.set("cursor", cursor);
        const response = await fetch(
          `/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/export/?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHistory(data.results || []);
          setPaginationMeta({
            hasNext: (data.next_page_results as boolean) || false,
            hasPrev: (data.prev_page_results as boolean) || false,
            nextCursor: (data.next_cursor as string | null) || null,
            prevCursor: (data.prev_cursor as string | null) || null,
            totalCount: (data.total_count as number) || 0,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, workspaceSlug]
  );

  useEffect(() => {
    if (isOpen) {
      void fetchHistory();
      setCurrentPage(1);

      const interval = setInterval(() => {
        void fetchHistory();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen, fetchHistory]);

  const handlePageChange = (direction: "next" | "prev"): void => {
    const cursor = direction === "next" ? paginationMeta.nextCursor : paginationMeta.prevCursor;
    void fetchHistory(cursor);
    setCurrentPage((p) => p + (direction === "next" ? 1 : -1));
  };

  const columns = getExportColumns();
  const rangeStart = (currentPage - 1) * 10 + 1;
  const rangeEnd = Math.min(currentPage * 10, paginationMeta.totalCount);

  return (
    <Collapsible.CollapsibleRoot isOpen={isOpen} onToggle={onToggle} className="mt-6">
      <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-3 hover:bg-layer-1-hover rounded-md cursor-pointer">
        <span className="text-sm font-medium text-color-primary">Previous Downloads</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 rounded hover:bg-layer-2 text-color-secondary"
            onClick={(e) => {
              e.stopPropagation();
              void fetchHistory();
              setCurrentPage(1);
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <ChevronDown className={`h-4 w-4 text-color-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </Collapsible.CollapsibleTrigger>
      <Collapsible.CollapsibleContent>
        {history.length > 0 ? (
          <>
            <Table
              data={history}
              columns={columns}
              keyExtractor={(row: any) => (row as IExporterHistory).id}
              tableClassName="w-full border-t border-color-subtle"
              tHeadTrClassName="!divide-x-0 border-b border-color-subtle !bg-transparent"
              tBodyTrClassName="!divide-x-0 border-b border-color-subtle py-2 hover:bg-layer-1-hover"
              thClassName="text-left py-3 px-5 font-normal"
              tdClassName="py-3 px-5"
            />
            {paginationMeta.totalCount > 10 && (
              <WorklogPaginationFooter
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalCount={paginationMeta.totalCount}
                hasNext={paginationMeta.hasNext}
                hasPrev={paginationMeta.hasPrev}
                isLoading={isLoading}
                onNext={() => handlePageChange("next")}
                onPrev={() => handlePageChange("prev")}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-color-tertiary">
            {isLoading ? "Loading..." : "No previous downloads"}
          </div>
        )}
      </Collapsible.CollapsibleContent>
    </Collapsible.CollapsibleRoot>
  );
}

export const PreviousDownloads = observer(PreviousDownloadsComponent);
