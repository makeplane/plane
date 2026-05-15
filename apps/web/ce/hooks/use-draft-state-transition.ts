import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

type ValidationResult = {
  missingFieldKeys: string[];
  missingFieldLabels: string[];
};

export const useDraftStateTransition = () => {
  const { getStateById } = useProjectState();
  const { t } = useTranslation();

  // currentStateGroup: pass the already-reactive stateDetails?.group from the component to avoid
  // a stale/undefined lookup when getStateById is called outside a MobX tracked context.
  const validateTransition = (issue: TIssue, newStateId: string, _currentStateGroup?: string): ValidationResult => {
    const newState = getStateById(newStateId);

    // Skip required-field check only when target state is backlog (draft) or cancelled.
    // All other target groups (unstarted/started/completed) require mandatory fields.
    if (newState?.group === "backlog" || newState?.group === "cancelled") {
      return { missingFieldKeys: [], missingFieldLabels: [] };
    }

    const missingFieldKeys: string[] = [];
    const missingFieldLabels: string[] = [];

    if (!issue.assignee_ids?.length) {
      missingFieldKeys.push("assignee_ids");
      missingFieldLabels.push(t("issue.add.assignee"));
    }
    if (!issue.start_date) {
      missingFieldKeys.push("start_date");
      missingFieldLabels.push(t("common.order_by.start_date"));
    }
    if (!issue.target_date) {
      missingFieldKeys.push("target_date");
      missingFieldLabels.push(t("issue.add.due_date"));
    }
    if (!issue.frequency) {
      missingFieldKeys.push("frequency");
      missingFieldLabels.push(t("common.frequency"));
    }

    return { missingFieldKeys, missingFieldLabels };
  };

  return { validateTransition };
};
