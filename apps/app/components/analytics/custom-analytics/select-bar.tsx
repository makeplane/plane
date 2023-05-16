// react-hook-form
import { Control, Controller, UseFormSetValue } from "react-hook-form";
// components
import { SelectProject, SelectSegment, SelectXAxis, SelectYAxis } from "components/analytics";
// types
import { IAnalyticsParams, IProject } from "types";

type Props = {
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  projects: IProject[];
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

export const AnalyticsSelectBar: React.FC<Props> = ({
  control,
  setValue,
  projects,
  params,
  fullScreen,
  isProjectLevel,
}) => (
  <div
    className={`grid items-center gap-4 p-5 pb-0.5 ${
      isProjectLevel ? "grid-cols-3" : "grid-cols-2"
    } ${fullScreen ? "lg:grid-cols-4" : ""}`}
  >
    {!isProjectLevel && (
      <div>
        <h6 className="text-xs text-brand-secondary">Project</h6>
        <Controller
          name="project"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectProject value={value} onChange={onChange} projects={projects} />
          )}
        />
      </div>
    )}
    <div>
      <h6 className="text-xs text-brand-secondary">Measure (y-axis)</h6>
      <Controller
        name="y_axis"
        control={control}
        render={({ field: { value, onChange } }) => (
          <SelectYAxis value={value} onChange={onChange} />
        )}
      />
    </div>
    <div>
      <h6 className="text-xs text-brand-secondary">Dimension (x-axis)</h6>
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
          />
        )}
      />
    </div>
    <div>
      <h6 className="text-xs text-brand-secondary">Group</h6>
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
