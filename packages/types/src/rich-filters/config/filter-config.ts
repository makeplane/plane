import { TFilterProperty, TFilterValue } from "../expression";
import { TOperatorConfigMap } from "../operator-configs";

/**
 * Main filter configuration type for different properties.
 * This is the primary configuration type used throughout the application.
 *
 * @template P - Property key type (e.g., 'state_id', 'priority', 'assignee')
 * @template V - Value type for the filter
 */
export type TFilterConfig<P extends TFilterProperty, V extends TFilterValue = TFilterValue> = {
  id: P;
  label: string;
  icon?: React.FC<React.SVGAttributes<SVGElement>>;
  isEnabled: boolean;
  allowMultipleFilters?: boolean;
  supportedOperatorConfigsMap: TOperatorConfigMap<V>;
};
