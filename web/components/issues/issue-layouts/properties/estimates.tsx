import { observer } from "mobx-react-lite";
// components
import { EstimateSelect } from "components/estimates";
// types
import { IEstimatePoint } from "types";

export interface IIssuePropertyEstimates {
  value: number | null;
  onChange: (value: number | null) => void;
  estimatePoints: IEstimatePoint[] | null;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyEstimates: React.FC<IIssuePropertyEstimates> = observer((props) => {
  const { value, onChange, estimatePoints, disabled, hideDropdownArrow = false } = props;

  return (
    <EstimateSelect
      value={value}
      onChange={onChange}
      estimatePoints={estimatePoints ?? undefined}
      buttonClassName="h-5"
      disabled={disabled}
      hideDropdownArrow={hideDropdownArrow}
    />
  );
});
