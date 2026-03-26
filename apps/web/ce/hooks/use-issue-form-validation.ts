import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { TIssue } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

type FieldRules = Record<string, unknown>;

export const useIssueFormValidation = (_projectId?: string | null) => {
  const { watch, clearErrors } = useFormContext<TIssue>();
  const { getStateById } = useProjectState();
  const selectedStateId = watch("state_id");
  const selectedState = selectedStateId ? getStateById(selectedStateId) : undefined;
  const isDraftState = selectedState?.group === "backlog";

  useEffect(() => {
    if (isDraftState) {
      clearErrors(); // clear all errors when switching to draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftState]);

  const getFieldRules = (originalRules: FieldRules): FieldRules => {
    if (!isDraftState) return originalRules;
    // Must explicitly set each key to undefined — returning {} doesn't override
    // previously registered rules in RHF's internal field map (register() spreads
    // new options onto the existing _f object, so omitted keys are NOT removed)
    const cleared: FieldRules = {};
    for (const key of Object.keys(originalRules)) {
      cleared[key] = undefined;
    }
    return cleared;
  };

  // Returns rules for task category fields: skips validation when draft state or no categories exist
  const getTaskCategoryFieldRules = (originalRules: FieldRules, categoriesExist: boolean): FieldRules => {
    if (isDraftState || !categoriesExist) return getFieldRules(originalRules);
    return originalRules;
  };

  return { isDraftState, getFieldRules, getTaskCategoryFieldRules };
};
