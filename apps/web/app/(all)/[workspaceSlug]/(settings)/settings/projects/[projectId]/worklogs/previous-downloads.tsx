import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ChevronDown, Download } from "lucide-react";
import { observer } from "mobx-react";
import { Avatar } from "@plane/propel/avatar";
import { Collapsible, Table } from "@plane/ui";

import { CEProjectWorklogService } from "@/plane-web/services/project-worklog.service";
import type { IExporterHistory } from "@/plane-web/types/worklog-export";
import { WorklogPaginationFooter } from "./worklog-pagination-footer";

interface IPreviousDownloadsProps {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const worklogService = new CEProjectWorklogService();

const STATUS_STYLES: Record<string, string> = {
  completed: "text-green-600",
  processing: "text-amber-500",
  queued: "text-blue-500",
  failed: "text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  processing: "Processing",
  queued: "Queued",
  failed: "Failed",
};

const getExportColumns = () => [
  {
    key: "initiated_by",
    content: "Exported By",
    tdRender: (row: IExporterHistory) => (
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 h-5 w-5">
          <Avatar src={row.initiated_by_detail?.avatar} name={row.initiated_by_detail?.display_name} size={20} />
        </div>
        <span className="text-sm">{row.initiated_by_detail?.display_name ?? "—"}</span>
      </div>
    ),
  },
  {
    key: "created_at",
    content: "Exported On",
    tdRender: (row: IExporterHistory) => (
      <span className="text-sm">
        {new Date(row.created_at).toLocaleString("sv-SE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    ),
  },
  {
    key: "project",
    content: "Exported projects",
    tdRender: (row: IExporterHistory) => <span className="text-sm">{row.project?.length ?? 0} project(s)</span>,
  },
  {
    key: "provider",
    content: "Format",
    tdRender: (row: IExporterHistory) => <span className="text-sm">{row.provider === "xlsx" ? "Excel" : "CSV"}</span>,
  },
  {
    key: "status",
    content: "Status",
    tdRender: (row: IExporterHistory) => (
      <span className={`text-sm ${STATUS_STYLES[row.status] ?? "text-color-tertiary"}`}>
        {STATUS_LABELS[row.status] ?? row.status}
      </span>
    ),
  },
  {
    key: "download",
    content: "Download",
    tdRender: (row: IExporterHistory) =>
      row.status === "completed" && row.url ? (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-link-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      ) : (
        <span className="text-color-tertiary text-sm">—</span>
      ),
  },
];

const PAGE_SIZE = 10;

function PreviousDownloadsComponent({ workspaceSlug, projectId, isOpen, onToggle }: IPreviousDownloadsProps) {
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
        const data = await worklogService.getExportHistory(workspaceSlug, projectId, cursor ?? undefined);
        setHistory(data.results || []);
        setPaginationMeta({
          hasNext: !!data.next_page_results,
          hasPrev: !!data.prev_page_results,
          nextCursor: data.next_cursor || null,
          prevCursor: data.prev_cursor || null,
          totalCount: data.total_count ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch export history", error);
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
  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, paginationMeta.totalCount);

  const triggerTitle = (
    <div className="flex w-full items-center justify-between px-5 py-3">
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
    </div>
  );

  return (
    <Collapsible
      title={triggerTitle}
      isOpen={isOpen}
      onToggle={onToggle}
      className="mt-6"
      buttonClassName="flex w-full hover:bg-layer-1-hover rounded-md cursor-pointer"
    >
      {history.length > 0 ? (
        <>
          <Table
            data={history}
            columns={columns}
            keyExtractor={(row: IExporterHistory) => row.id}
            tableClassName="w-full border-t border-color-subtle"
            tHeadTrClassName="!divide-x-0 border-b border-color-subtle !bg-transparent"
            tBodyTrClassName="!divide-x-0 border-b border-color-subtle py-2 hover:bg-layer-1-hover"
            thClassName="text-left py-3 px-5 font-normal"
            tdClassName="py-3 px-5"
          />
          {paginationMeta.totalCount > PAGE_SIZE && (
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
    </Collapsible>
  );
}

export const PreviousDownloads = observer(PreviousDownloadsComponent);
