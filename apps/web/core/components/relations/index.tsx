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

import { useParams } from "next/navigation";
import { CircleDot, XCircle, ArrowRightToLine, ArrowRightFromLine } from "lucide-react";
// Plane
import { DuplicatePropertyIcon, RelatedIcon } from "@plane/propel/icons";
// components
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
// Plane-web
import { useFlag } from "@/plane-web/hooks/store";
import type { TIssueRelationTypes } from "@/types";

const COMMON_WORK_ITEM_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
  relates_to: {
    key: "relates_to",
    i18n_label: "issue.relation.relates_to",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <RelatedIcon height={size} width={size} className="text-secondary" />,
    placeholder: "Add related work items",
  },
  duplicate: {
    key: "duplicate",
    i18n_label: "issue.relation.duplicate",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <DuplicatePropertyIcon height={size} width={size} className="text-secondary" />,
    placeholder: "None",
  },
  blocked_by: {
    key: "blocked_by",
    i18n_label: "issue.relation.blocked_by",
    className: "bg-danger-subtle text-danger-primary",
    icon: (size) => <CircleDot size={size} className="text-secondary" />,
    placeholder: "None",
  },
  blocking: {
    key: "blocking",
    i18n_label: "issue.relation.blocking",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} className="text-secondary" />,
    placeholder: "None",
  },
};

export const WORK_ITEM_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
  ...COMMON_WORK_ITEM_RELATION_OPTIONS,
  start_before: {
    key: "start_before",
    i18n_label: "issue.relation.start_before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-danger-subtle text-danger-primary",
    placeholder: "None",
  },
  start_after: {
    key: "start_after",
    i18n_label: "issue.relation.start_after",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
  finish_before: {
    key: "finish_before",
    i18n_label: "issue.relation.finish_before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-danger-subtle text-danger-primary",
    placeholder: "None",
  },
  finish_after: {
    key: "finish_after",
    i18n_label: "issue.relation.finish_after",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
  implements: {
    key: "implements",
    i18n_label: "issue.relation.implements",
    icon: (size: number) => <ArrowRightToLine size={size} />,
    className: "bg-danger-subtle text-danger-primary",
    placeholder: "None",
  },
  implemented_by: {
    key: "implemented_by",
    i18n_label: "issue.relation.implemented_by",
    icon: (size: number) => <ArrowRightFromLine size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
};

export const useTimeLineRelationOptions = () => {
  const { workspaceSlug } = useParams();

  const isDependencyEnabled = useFlag(workspaceSlug.toString(), "TIMELINE_DEPENDENCY");

  return isDependencyEnabled
    ? WORK_ITEM_RELATION_OPTIONS
    : {
        ...COMMON_WORK_ITEM_RELATION_OPTIONS,
        start_before: undefined,
        start_after: undefined,
        finish_before: undefined,
        finish_after: undefined,
        implements: undefined,
        implemented_by: undefined,
      };
};
