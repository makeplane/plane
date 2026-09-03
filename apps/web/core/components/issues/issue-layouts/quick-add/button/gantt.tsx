/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { AddOutline } from "@makeplane/propel/icons";
import { Row } from "@plane/ui";
import type { TQuickAddIssueButton } from "../root";

export const GanttQuickAddIssueButton = observer(function GanttQuickAddIssueButton(props: TQuickAddIssueButton) {
  const { onClick, isEpic = false } = props;
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="sticky bottom-0 z-[1] flex w-full cursor-pointer items-center border-t-[1px] border-subtle bg-layer-transparent hover:bg-layer-transparent-hover"
      onClick={onClick}
    >
      <Row className="flex gap-2 py-2">
        <AddOutline className="my-auto h-3.5 w-3.5" />
        <span className="text-13 font-medium">{t(`${isEpic ? "epic.new" : "issue.new"}`)}</span>
      </Row>
    </button>
  );
});
