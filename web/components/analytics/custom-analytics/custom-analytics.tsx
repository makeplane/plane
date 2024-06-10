import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { IAnalyticsParams } from "@plane/types";
// services
// components
import { CustomAnalyticsSelectBar, CustomAnalyticsMainContent, CustomAnalyticsSidebar } from "@/components/analytics";
// types
// fetch-keys
import { ANALYTICS } from "@/constants/fetch-keys";
import { cn } from "@/helpers/common.helper";
import { useAppTheme } from "@/hooks/store";
import { AnalyticsService } from "@/services/analytics.service";

type Props = {
  additionalParams?: Partial<IAnalyticsParams>;
  fullScreen: boolean;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const analyticsService = new AnalyticsService();

export const CustomAnalytics: React.FC<Props> = observer((props) => {
  const { additionalParams, fullScreen } = props;

  const { workspaceSlug, projectId } = useParams();

  const { control, watch, setValue } = useForm({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: projectId ? [projectId.toString()] : watch("project"),
    ...additionalParams,
  };

  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const { workspaceAnalyticsSidebarCollapsed } = useAppTheme();

  const isProjectLevel = projectId ? true : false;

  return (
    <div className={cn("relative flex h-full w-full overflow-hidden", isProjectLevel ? "flex-col-reverse" : "")}>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CustomAnalyticsSelectBar
          control={control}
          setValue={setValue}
          params={params}
          fullScreen={fullScreen}
          isProjectLevel={isProjectLevel}
        />
        <CustomAnalyticsMainContent
          analytics={analytics}
          error={analyticsError}
          params={params}
          fullScreen={fullScreen}
        />
      </div>

      <div
        className={cn(
          "border-l border-custom-border-200 transition-all",
          !isProjectLevel
            ? "absolute bottom-0 right-0 top-0 h-full max-w-[250px] flex-shrink-0 sm:max-w-full md:relative"
            : ""
        )}
        style={workspaceAnalyticsSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
      >
        <CustomAnalyticsSidebar analytics={analytics} params={params} isProjectLevel={isProjectLevel} />
      </div>
    </div>
  );
});
