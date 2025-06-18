import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { ChartXAxisProperty, ChartYAxisMetric, IAnalyticsParams } from "@plane/types";
import { cn } from "@plane/utils";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { AnalyticsSelectParams } from "../select/analytics-params";
import PriorityChart from "./priority-chart";

const defaultValues: IAnalyticsParams = {
  x_axis: ChartXAxisProperty.PRIORITY,
  y_axis: ChartYAxisMetric.WORK_ITEM_COUNT,
};

const CustomizedInsights = observer(({ peekView }: { peekView?: boolean }) => {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { control, watch, setValue } = useForm<IAnalyticsParams>({
    defaultValues: {
      ...defaultValues,
    },
  });

  const params = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    group_by: watch("group_by"),
  };

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.customized_insights")}
      className="col-span-1"
      headerClassName={cn(peekView ? "flex-col items-start" : "")}
      actions={
        <AnalyticsSelectParams
          control={control}
          setValue={setValue}
          params={params}
          workspaceSlug={workspaceSlug.toString()}
        />
      }
    >
      <PriorityChart x_axis={params.x_axis} y_axis={params.y_axis} group_by={params.group_by} />
    </AnalyticsSectionWrapper>
  );
});

export default CustomizedInsights;
