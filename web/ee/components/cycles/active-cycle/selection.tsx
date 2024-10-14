import { observer } from "mobx-react";
import { cn } from "@plane/editor";
import { TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { CustomSelect, Row } from "@plane/ui";
import { useProjectEstimates } from "@/hooks/store";

type options = {
  value: string;
  label: string;
};
const cycleChartOptions: options[] = [
  { value: "burndown", label: "Burn-down" },
  { value: "burnup", label: "Build-up" },
];
export const cycleEstimateOptions: options[] = [
  { value: "issues", label: "issues" },
  { value: "points", label: "points" },
];

export type TSelectionProps = {
  plotType: TCyclePlotType;
  estimateType: TCycleEstimateType;
  projectId: string;
  handlePlotChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  handleEstimateChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  className?: string;
  showEstimateSelection?: boolean;
};
export type TDropdownProps = {
  value: string;
  onChange: (value: TCyclePlotType | TCycleEstimateType) => Promise<void>;
  options: any[];
};
const Dropdown = ({ value, onChange, options }: TDropdownProps) => (
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
const Selection = observer((props: TSelectionProps) => {
  const {
    plotType,
    estimateType,
    projectId,
    handlePlotChange,
    handleEstimateChange,
    className,
    showEstimateSelection,
  } = props;
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  return (
    <Row className={cn("h-[40px] mt-2 py-4 flex text-sm items-center gap-2 font-medium", className)}>
      <Dropdown value={plotType} onChange={handlePlotChange} options={cycleChartOptions} />
      {showEstimateSelection && isCurrentProjectEstimateEnabled && (
        <>
          <span className="text-custom-text-400">for</span>
          <Dropdown value={estimateType} onChange={handleEstimateChange} options={cycleEstimateOptions} />
        </>
      )}
    </Row>
  );
});

export default Selection;
