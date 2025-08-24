import { EAutomationRunStatus } from "@plane/types";

/**
 * Get the label for the automation run status
 * @param runStatus - The status of the automation run
 * @returns The label for the automation run status
 */
export const getAutomationRunStatusLabel = (runStatus: EAutomationRunStatus) => {
  switch (runStatus) {
    case EAutomationRunStatus.PENDING:
      return "Pending";
    case EAutomationRunStatus.RUNNING:
      return "Running";
    case EAutomationRunStatus.SUCCESS:
      return "Success";
    case EAutomationRunStatus.FAILED:
      return "Failed";
    case EAutomationRunStatus.CANCELLED:
      return "Cancelled";
  }
};
