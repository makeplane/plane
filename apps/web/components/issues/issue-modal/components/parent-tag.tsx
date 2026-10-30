/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseOutline } from "@makeplane/propel/icons";
// plane imports
// types
import type { ISearchIssueResponse, TIssue } from "@plane/types";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type TIssueParentTagProps = {
  control: Control<TIssue>;
  selectedParentIssue: ISearchIssueResponse;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse | null) => void;
};

export const IssueParentTag = observer(function IssueParentTag(props: TIssueParentTagProps) {
  const { control, selectedParentIssue, handleFormChange, setSelectedParentIssue } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  return (
    <Controller
      control={control}
      name="parent_id"
      render={({ field: { onChange } }) => (
        <div className="inline-flex h-(--control-height-sm) w-min max-w-full items-center gap-1 rounded-md border border-subtle-1 bg-layer-2 px-(--control-padding-x-sm) text-caption-md-regular whitespace-nowrap">
          <span
            className="block size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: selectedParentIssue.state__color,
            }}
          />
          {selectedParentIssue?.project_id && (
            <IssueIdentifier
              projectId={selectedParentIssue.project_id}
              issueTypeId={selectedParentIssue.type_id}
              projectIdentifier={selectedParentIssue?.project__identifier}
              issueSequenceId={selectedParentIssue.sequence_id}
              size="xs"
              variant="secondary"
            />
          )}
          <span className="truncate text-primary">{selectedParentIssue.name.substring(0, 50)}</span>
          <button
            type="button"
            className="grid shrink-0 place-items-center text-icon-tertiary hover:text-icon-secondary"
            aria-label={t("issue.remove.parent.label")}
            onClick={() => {
              onChange(null);
              handleFormChange();
              setSelectedParentIssue(null);
            }}
            tabIndex={getIndex("remove_parent")}
          >
            <CloseOutline className="size-3.5" />
          </button>
        </div>
      )}
    />
  );
});
