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
import { useParams } from "next/navigation";
import { Zap, ListTodo, Mail } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EInboxIssueSource } from "@plane/types";
// hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";

const sourcePillMap = {
  [EInboxIssueSource.IN_APP]: {
    label: "In-app",
    icon: Zap,
  },
  [EInboxIssueSource.FORMS]: {
    label: "Forms",
    icon: ListTodo,
  },
  [EInboxIssueSource.EMAIL]: {
    label: "Mail",
    icon: Mail,
  },
};

export type TInboxSourcePill = {
  source: EInboxIssueSource;
};

export const InboxSourcePill = observer(function InboxSourcePill(props: TInboxSourcePill) {
  const { source } = props;
  const { workspaceSlug } = useParams();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  const sourceDetails = sourcePillMap[source];
  if (!sourceDetails) return null;
  return isEmailEnabled || isFormEnabled ? (
    <div className="relative flex gap-1 p-1.5 py-0.5 rounded-sm bg-layer-1 items-center">
      <sourceDetails.icon className="h-3 w-3 flex-shrink-0 text-tertiary" />
      <span className="text-11 text-tertiary font-medium">{sourceDetails.label}</span>
    </div>
  ) : (
    <></>
  );
});
