import { SeparatorBasedFilterAdapter } from "@plane/shared-state";
import {
  EQUALITY_OPERATOR,
  EXTERNAL_WIDGET_OPERATOR_SEPARATOR,
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression,
} from "@plane/types";

export class DashboardWidgetFilterAdapter extends SeparatorBasedFilterAdapter<
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression
> {
  protected config = {
    operatorSeparator: EXTERNAL_WIDGET_OPERATOR_SEPARATOR,
    defaultOperator: EQUALITY_OPERATOR.EXACT,
    handleArrayAsCommaSeparated: true,
  };

  protected _createEmptyExpression(): TExternalDashboardWidgetFilterExpression {
    return {};
  }
}
