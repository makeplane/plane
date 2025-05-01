import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
// plane imports
import { ANALYTICS_V2_X_AXIS_VALUES, ChartYAxisMetric } from "@plane/constants";
import { IAnalyticsV2Params } from "@plane/types";
import { Row } from "@plane/ui";
// components
import { SelectXAxis } from "./select-x-axis";
import { SelectYAxis } from "./select-y-axis";
// hooks

type Props = {
  control: Control<IAnalyticsV2Params, any>;
};

export const AnalyticsV2SelectParams: React.FC<Props> = observer((props) => {
  const { control } = props;
  const analyticsOptions = ANALYTICS_V2_X_AXIS_VALUES;

  return (
    <Row
      className={`flex items-center gap-3`}
    >
      <Controller
        name="y_axis"
        control={control}
        render={({ field: { value, onChange } }) => (
          <SelectYAxis
            value={value}
            onChange={(val: string) => {
              onChange(val);
            }}
            hiddenOptions={[ChartYAxisMetric.ESTIMATE_POINT_COUNT]}
          />
        )}
      />
      <Controller
        name="x_axis"
        control={control}
        render={({ field: { value, onChange } }) => (
          <SelectXAxis
            value={value}
            onChange={(val: string) => {
              onChange(val);
            }}
            analyticsOptions={analyticsOptions}
          />
        )}
      />
      <Controller
        name="group_by"
        control={control}
        render={({ field: { value, onChange } }) => (
          <SelectXAxis
            value={value}
            onChange={(val: string) => {
              onChange(val);
            }}
            analyticsOptions={analyticsOptions}
          />
        )}
      />
    </Row>
  );
});
