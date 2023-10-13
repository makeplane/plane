import { useRouter } from "next/router";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// services
import { AnalyticsService } from "services/analytics.service";
// components
import { CustomAnalyticsSelectBar, CustomAnalyticsMainContent, CustomAnalyticsSidebar } from "components/analytics";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

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

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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

  const isProjectLevel = projectId ? true : false;

  return (
    <div className={`overflow-hidden flex flex-col-reverse ${fullScreen ? "md:grid md:grid-cols-4 md:h-full" : ""}`}>
      <div className="col-span-3 flex flex-col h-full overflow-hidden">
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
          fullScreen={fullScreen}
          params={params}
        />
      </div>
      <CustomAnalyticsSidebar
        analytics={analytics}
        params={params}
        fullScreen={fullScreen}
        isProjectLevel={isProjectLevel}
      />
    </div>
  );
});
