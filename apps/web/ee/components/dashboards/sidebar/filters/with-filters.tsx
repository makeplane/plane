import { ComponentType, useEffect, useRef } from "react";
/**
 * plane imports
 */
import { FilterInstance, IFilterInstance } from "@plane/shared-state";
import { TDashboardWidget, TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression } from "@plane/types";
/**
 * local imports
 */
import { DashboardWidgetFilterAdapter } from "./adapter";

interface WithFiltersProps {
  filters?: IFilterInstance<TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression> | null;
  projectIds?: string[];
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
}

export const withFilters = <P extends WithFiltersProps>(WrappedComponent: ComponentType<P>) => {
  const WithFiltersComponent = (
    props: Omit<P, "filters"> & {
      initialFilters?: TExternalDashboardWidgetFilterExpression;
    }
  ) => {
    const { initialFilters, handleSubmit } = props;
    const filtersRef = useRef<IFilterInstance<
      TDashboardWidgetFilterKeys,
      TExternalDashboardWidgetFilterExpression
    > | null>(null);

    useEffect(() => {
      filtersRef.current = new FilterInstance<TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression>({
        adapter: new DashboardWidgetFilterAdapter(),
        onExpressionChange: (expression) => {
          handleSubmit({
            filters: expression,
          });
        },
        initialExpression: initialFilters ?? undefined,
      });

      return () => {
        filtersRef.current = null;
      };
    }, [initialFilters, handleSubmit]);

    if (!filtersRef.current) return null;

    return <WrappedComponent {...(props as P)} filters={filtersRef.current} />;
  };

  WithFiltersComponent.displayName = `WithFiltersHoc(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithFiltersComponent;
};
