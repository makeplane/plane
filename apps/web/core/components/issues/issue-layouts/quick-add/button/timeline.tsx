/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import { Row } from "@plane/ui";
import type { TQuickAddIssueButton } from "../root";

export const TimelineQuickAddWorkItemButton = observer(function TimelineQuickAddWorkItemButton(
  props: TQuickAddIssueButton
) {
  const { onClick, isEpic = false } = props;
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="sticky bottom-0 z-[1] flex w-full cursor-pointer items-center border-t-[1px] border-subtle bg-layer-transparent hover:bg-layer-transparent-hover"
      onClick={onClick}
    >
      <Row className="flex py-2 gap-2">
        <PlusIcon className="h-3.5 w-3.5 stroke-2 my-auto" />
        <span className="text-13 font-medium">{t(`${isEpic ? "epic.new" : "issue.new"}`)}</span>
      </Row>
    </button>
  );
});
