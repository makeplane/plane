import { observer } from "mobx-react";
// icons
import { Contrast, LayoutGrid, Users, Loader as Spinner } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { truncateText } from "@/helpers/string.helper";
// hooks
import { useProject } from "@/hooks/store";

type Props = {
  projectIds: string[];
  isLoading: boolean;
  isUpdating: boolean;
};

export const CustomAnalyticsSidebarProjectsList: React.FC<Props> = observer((props) => {
  const { projectIds, isLoading, isUpdating } = props;
  // store hooks
  const { getProjectById, getProjectAnalyticsCountById } = useProject();
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col gap-4 h-full">
      <div className="flex gap-2 items-center">
        <h4 className="font-medium">{t("workspace_analytics.selected_projects")}</h4>
        {isUpdating && <Spinner className="animate-spin size-3" />}
      </div>
      <div className="relative space-y-6 overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-md">
        {projectIds.map((projectId) => {
          const project = getProjectById(projectId);
          const projectAnalyticsCount = getProjectAnalyticsCountById(projectId);

          if (!project) return;

          return (
            <div key={projectId} className="w-full">
              <div className="flex items-center gap-1 text-sm">
                <div className="h-6 w-6 grid place-items-center">
                  <Logo logo={project.logo_props} />
                </div>
                <h5 className="flex items-center gap-1">
                  <p className="break-words">{truncateText(project.name, 20)}</p>
                  <span className="ml-1 text-xs text-custom-text-200">({project.identifier})</span>
                </h5>
              </div>
              <div className="mt-4 w-full space-y-3 px-2">
                {isLoading ? (
                  <Loader className="space-y-3">
                    <Loader.Item height="16px" />
                    <Loader.Item height="16px" />
                    <Loader.Item height="16px" />
                  </Loader>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="text-custom-text-200" size={14} strokeWidth={2} />
                        <h6>{t("workspace_analytics.total_members")}</h6>
                      </div>
                      <span className="text-custom-text-200">{projectAnalyticsCount?.total_members}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Contrast className="text-custom-text-200" size={14} strokeWidth={2} />
                        <h6>{t("workspace_analytics.total_cycles")}</h6>
                      </div>
                      <span className="text-custom-text-200">{projectAnalyticsCount?.total_cycles}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="text-custom-text-200" size={14} strokeWidth={2} />
                        <h6>{t("workspace_analytics.total_modules")}</h6>
                      </div>
                      <span className="text-custom-text-200">{projectAnalyticsCount?.total_modules}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
