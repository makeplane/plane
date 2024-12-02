import { mergeEnums } from "../helper";
import {
  EmptyStateDetails,
  ECoreEmptyState,
  coreEmptyStateDetails,
} from "../core/empty-state";

enum EEmptyState {}

// Create a combined enum
export const EmptyStateType = mergeEnums(ECoreEmptyState, EEmptyState);

const emptyStateDetails: Record<
  EEmptyState,
  EmptyStateDetails<EEmptyState>
> = {} as const;

export type TEmptyStateType = ECoreEmptyState | EEmptyState;

export const EMPTY_STATE_DETAILS: Record<
  TEmptyStateType,
  EmptyStateDetails<TEmptyStateType>
> = {
  ...coreEmptyStateDetails,
  ...emptyStateDetails,
};
