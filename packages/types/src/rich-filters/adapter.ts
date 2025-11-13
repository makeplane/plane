// local imports
import type { TFilterExpression, TFilterProperty } from "./expression";

/**
 * External filter format
 */
export type TExternalFilter = Record<string, unknown> | undefined | null;

/**
 * Adapter for converting between internal filter trees and external formats.
 * @template P - Filter property type (e.g., 'state_id', 'priority', 'assignee')
 * @template E - External filter format type (e.g., work item filters, automation filters)
 */
export interface IFilterAdapter<P extends TFilterProperty, E extends TExternalFilter> {
  /**
   * Converts external format to internal filter tree.
   */
  toInternal(externalFilter: E): TFilterExpression<P> | null;
  /**
   * Converts internal filter tree to external format.
   */
  toExternal(internalFilter: TFilterExpression<P> | null): E;
}
