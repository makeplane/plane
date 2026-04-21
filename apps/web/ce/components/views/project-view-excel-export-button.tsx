import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
import * as XLSX from "xlsx";
import { ALL_ISSUES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EIssuesStoreType } from "@plane/types";
import { useIssues } from "@/hooks/store/use-issues";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { buildExportRow } from "@/plane-web/components/workspace/views/export-row-builder";

const WARN_THRESHOLD = 500;
const MAX_FETCH_ITERATIONS = 50;

type Props = { workspaceSlug: string; projectId: string; viewId: string };

export const ProjectViewExcelExportButton = observer(function ProjectViewExcelExportButton({
  workspaceSlug,
  projectId,
  viewId,
}: Props) {
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { issues, issueMap } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { getStateById } = useProjectState();
  const { getProjectById } = useProject();
  const { getModuleById } = useModule();
  const { getCycleById } = useCycle();
  const { getLabelById } = useLabel();
  const { workspace: workspaceMember, getUserDetails } = useMember();
  const { currentWorkspace } = useWorkspace();

  const totalCount = issues.getGroupIssueCount(undefined, undefined, false) ?? 0;

  const buildRows = () => {
    const allIds = (issues.groupedIssueIds?.[ALL_ISSUES] as string[] | undefined) ?? [];
    return allIds
      .map((id) => issueMap[id])
      .filter(Boolean)
      .map((issue) =>
        buildExportRow(issue, t, {
          workspaceName: currentWorkspace?.name ?? "",
          getStateById,
          getProjectById,
          getModuleById,
          getCycleById,
          getLabelById,
          getWorkspaceMemberDetails: (id) => workspaceMember.getWorkspaceMemberDetails(id),
          getUserDetails,
        })
      );
  };

  const doExport = async () => {
    setIsExporting(true);
    setShowWarning(false);
    try {
      let iterations = 0;
      while (iterations < MAX_FETCH_ITERATIONS) {
        const pagination = issues.getPaginationData(undefined, undefined);
        if (!pagination?.nextPageResults) break;
        await issues.fetchNextIssues(workspaceSlug, projectId, viewId);
        iterations++;
      }
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Issues");
      const projectName = (getProjectById(projectId)?.name ?? projectId).replace(/\s+/g, "_");
      const filename = `${workspaceSlug}-${projectName}-${new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "")}.xlsx`;
      XLSX.writeFile(wb, filename);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClick = () => {
    if (totalCount > WARN_THRESHOLD) setShowWarning(true);
    else void doExport();
  };

  return (
    <>
      <Button variant="secondary" size="lg" onClick={handleClick} loading={isExporting} disabled={isExporting}>
        {isExporting ? t("workspace_views.export.button_loading") : t("workspace_views.export.button")}
      </Button>

      <Transition.Root show={showWarning} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setShowWarning(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-lg bg-surface-1 border border-subtle p-6 shadow-xl">
                  <Dialog.Title as="h3" className="text-base font-semibold text-primary">
                    {t("workspace_views.export.warning_title")}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-secondary">
                    {t("workspace_views.export.warning_message", { count: totalCount })}
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="tertiary" size="sm" onClick={() => setShowWarning(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => void doExport()}>
                      {t("workspace_views.export.warning_confirm")}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
});
