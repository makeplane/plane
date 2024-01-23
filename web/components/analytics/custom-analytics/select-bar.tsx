import { observer } from "mobx-react-lite";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
// hooks
import { useProject } from "hooks/store";
// components
import { SelectProject, SelectSegment, SelectXAxis, SelectYAxis } from "components/analytics";
// types
import { IAnalyticsParams } from "@plane/types";

type Props = {
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

export const CustomAnalyticsSelectBar: React.FC<Props> = observer((props) => {
  const { control, setValue, params, fullScreen, isProjectLevel } = props;

  const { workspaceProjectIds: workspaceProjectIds } = useProject();

  return (
    <div
      className={`grid items-center gap-4 px-5 py-2.5 ${isProjectLevel ? "grid-cols-3" : "grid-cols-2"} ${
        fullScreen ? "md:py-5 lg:grid-cols-4" : ""
      }`}
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
            <SelectSegment value={value} onChange={onChange} params={params} />
          )}
        />
      </div>
    </div>
  );
});
