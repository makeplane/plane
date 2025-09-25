import { SeparatorBasedFilterAdapter } from "@plane/shared-state";
import { EQUALITY_OPERATOR } from "@plane/types";
import {
  EXTERNAL_INITIATIVE_FILTER_OPERATOR_SEPARATOR,
  TExternalInitiativeFilterExpression,
  TInitiativeFilterKeys,
} from "@/plane-web/types/initiative";

export class InitiativesFilterAdapter extends SeparatorBasedFilterAdapter<
  TInitiativeFilterKeys,
  TExternalInitiativeFilterExpression
> {
  protected config = {
    operatorSeparator: EXTERNAL_INITIATIVE_FILTER_OPERATOR_SEPARATOR,
    defaultOperator: EQUALITY_OPERATOR.EXACT,
    handleArrayAsCommaSeparated: true,
  };

  protected _createEmptyExpression(): TExternalInitiativeFilterExpression {
    return {};
  }
}
