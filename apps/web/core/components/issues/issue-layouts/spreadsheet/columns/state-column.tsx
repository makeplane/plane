/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// types
import type { TIssue } from "@plane/types";
// components
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { useDraftStateTransition } from "@/hooks/store/use-draft-state-transition";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

export const SpreadsheetStateColumn = observer(function SpreadsheetStateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();
  const { validateTransition } = useDraftStateTransition();
  const stateDetails = getStateById(issue.state_id);

  const handleStateChange = (data: string) => {
    const { missingFieldLabels } = validateTransition(issue, data, stateDetails?.group);
    if (missingFieldLabels.length > 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("issue.required_fields_missing"),
        message: missingFieldLabels.join(", "),
      });
      return;
    }
    onChange(issue, { state_id: data }, { changed_property: "state", change_details: data });
  };

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <StateDropdown
        projectId={issue.project_id ?? undefined}
        value={issue.state_id}
        onChange={handleStateChange}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
        buttonContainerClassName="w-full"
        onClose={onClose}
        showTooltip
      />
    </div>
  );
});
