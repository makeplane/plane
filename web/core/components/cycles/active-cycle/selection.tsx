import { useCycle } from "@/hooks/store";
import { ICycle, TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { CustomSelect, Row } from "@plane/ui";
import { observer } from "mobx-react";

type options = {
  value: string;
  label: string;
};
const cycleChartOptions: options[] = [
  { value: "burndown", label: "Burn-down" },
  { value: "burnup", label: "Burn-up" },
];
const cycleEstimateOptions: options[] = [
  { value: "issues", label: "issues" },
  { value: "points", label: "points" },
];

export type TSelectionProps = {
  plotType: TCyclePlotType;
  estimateType: TCycleEstimateType;
  handlePlotChange: (value: TCyclePlotType) => Promise<void>;
  handleEstimateChange: (value: TCycleEstimateType) => Promise<void>;
};
export type TDropdownProps = {
  value: string;
  onChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  options: any[];
};
const Dropdown = ({ value, onChange, options }: TDropdownProps) => {
  return (
    <div className="relative flex items-center gap-2">
      <CustomSelect
        value={value}
        label={<span>{options.find((v) => v.value === value)?.label ?? "None"}</span>}
        onChange={onChange}
        maxHeight="lg"
        buttonClassName="bg-custom-background-90 border-none rounded text-sm font-medium"
      >
        {options.map((item) => (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
};
const Selection = observer((props: TSelectionProps) => {
  const { plotType, estimateType, handlePlotChange, handleEstimateChange } = props;

  return (
    <Row className="h-[40px] py-4 flex text-sm items-center gap-2 font-medium">
      <Dropdown value={plotType} onChange={handlePlotChange} options={cycleChartOptions} />
      <span className="text-custom-text-400">for</span>
      <Dropdown value={estimateType} onChange={handleEstimateChange} options={cycleEstimateOptions} />
    </Row>
  );
});

export default Selection;
