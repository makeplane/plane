import { observer } from "mobx-react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
import { IAnalyticsParams } from "@plane/types";
// hooks
import { SelectProject, SelectSegment, SelectXAxis, SelectYAxis } from "@/components/analytics";
import { ANALYTICS_X_AXIS_VALUES } from "@/constants/analytics";
import { useProject } from "@/hooks/store";
// components
// types

type Props = {
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

export const CustomAnalyticsSelectBar: React.FC<Props> = observer((props) => {
  const { control, setValue, params, fullScreen, isProjectLevel } = props;

  const { workspaceProjectIds: workspaceProjectIds, currentProjectDetails } = useProject();

  const analyticsOptions = isProjectLevel
    ? ANALYTICS_X_AXIS_VALUES.filter((v) => {
        if (v.value === "issue_cycle__cycle_id" && !currentProjectDetails?.cycle_view) return false;
        if (v.value === "issue_module__module_id" && !currentProjectDetails?.module_view) return false;
        return true;
      })
    : ANALYTICS_X_AXIS_VALUES;

  return (
    <div
      className={`grid items-center gap-4 px-5 py-2.5 ${
        isProjectLevel ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
      } ${fullScreen ? "md:py-5 lg:grid-cols-4" : ""}`}
    >
      {!isProjectLevel && (
        <div>
          <h6 className="text-xs text-custom-text-200">Project</h6>
          <Controller
            name="project"
            control={control}
            render={({ field: { value, onChange } }) => (
              <SelectProject
                value={value ?? undefined}
                onChange={onChange}
                projectIds={workspaceProjectIds ?? undefined}
              />
            )}
          />
        </div>
      )}
      <div>
        <h6 className="text-xs text-custom-text-200">Measure (y-axis)</h6>
        <Controller
          name="y_axis"
          control={control}
          render={({ field: { value, onChange } }) => <SelectYAxis value={value} onChange={onChange} />}
        />
      </div>
      <div>
        <h6 className="text-xs text-custom-text-200">Dimension (x-axis)</h6>
        <Controller
          name="x_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value}
              onChange={(val: string) => {
                if (params.segment === val) setValue("segment", null);

                onChange(val);
              }}
              params={params}
              analyticsOptions={analyticsOptions}
            />
          )}
        />
      </div>
      <div>
        <h6 className="text-xs text-custom-text-200">Group</h6>
        <Controller
          name="segment"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectSegment value={value} onChange={onChange} params={params} analyticsOptions={analyticsOptions} />
          )}
        />
      </div>
    </div>
  );
});
