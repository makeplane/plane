import { TSentryStateMapping } from "@plane/etl/sentry";
import { ExState } from "@plane/sdk";

/**
 * Interface for Sentry State Mapping Form Props
 */
export interface StateMappingFormProps {
  modal: boolean;
  handleSubmit: (projectId: string, resolvedState: ExState, unresolvedState: ExState) => Promise<void>;
  stateMapping?: TSentryStateMapping;
  handleModal: (modal: boolean) => void;
  availableProjects: string[];
}

/**
 * Interface for Sentry State Mapping Form Data
 */
export interface SentryStateMappingFormData {
  projectId: string;
  resolvedState: ExState | null;
  unresolvedState: ExState | null;
}

/**
 * Interface for State Mapping Form Content Props
 */
export interface StateMappingFormContentProps {
  value: SentryStateMappingFormData;
  availableProjects: string[];
  handleChange: <T extends keyof SentryStateMappingFormData>(key: T, value: SentryStateMappingFormData[T]) => void;
  isEditMode: boolean;
}
