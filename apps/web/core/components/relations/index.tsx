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

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CircleDot, XCircle, ArrowRightToLine, ArrowRightFromLine } from "lucide-react";
// Plane
import { DuplicatePropertyIcon, RelatedIcon } from "@plane/propel/icons";
// components
import type { TRelationObject, TRelationOptionsMap } from "@/components/issues/issue-detail-widgets/relations";
// hooks
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
// Plane-web
import { useFlag } from "@/plane-web/hooks/store";
import type { TIssueRelationTypes } from "@/types";

// --- Dependency options (hardcoded types) ---

const CORE_DEPENDENCY_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
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

const EXTENDED_DEPENDENCY_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
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
};

// --- Relation options (custom / built-in) ---

const CORE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
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
};

const EXTENDED_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
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

// --- Combined maps (kept for backward compatibility) ---

const COMMON_WORK_ITEM_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
  ...CORE_RELATION_OPTIONS,
  ...CORE_DEPENDENCY_OPTIONS,
};

export const WORK_ITEM_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
  ...COMMON_WORK_ITEM_RELATION_OPTIONS,
  ...EXTENDED_DEPENDENCY_OPTIONS,
  ...EXTENDED_RELATION_OPTIONS,
};

// --- Dependency keys set (re-exported from constants for convenience) ---

export { DEPENDENCY_RELATION_KEYS } from "@/constants/timeline";

// --- Hooks ---

export const useDependencyOptions = () => {
  const { workspaceSlug } = useParams();
  const isDependencyEnabled = useFlag(workspaceSlug.toString(), "TIMELINE_DEPENDENCY");

  return isDependencyEnabled ? { ...CORE_DEPENDENCY_OPTIONS, ...EXTENDED_DEPENDENCY_OPTIONS } : CORE_DEPENDENCY_OPTIONS;
};

export const useCustomRelationOptions = (): TRelationOptionsMap => {
  const { sortedRelationDefinitions } = useRelationDefinition();

  return useMemo(() => {
    const options: TRelationOptionsMap = {};
    for (const definition of sortedRelationDefinitions) {
      // Outward direction entry
      options[`${definition.id}::${definition.outward}`] = {
        key: `${definition.id}::${definition.outward}`,
        i18n_label: definition.outward,
        rawLabel: definition.outward,
        className: "bg-layer-1 text-secondary",
        icon: (size: number) => <RelatedIcon height={size} width={size} className="text-secondary" />,
        placeholder: "None",
        isDefault: definition.is_default,
      };
      // Inward direction entry
      options[`${definition.id}::${definition.inward}`] = {
        key: `${definition.id}::${definition.inward}`,
        i18n_label: definition.inward,
        rawLabel: definition.inward,
        className: "bg-layer-1 text-secondary",
        icon: (size: number) => <RelatedIcon height={size} width={size} className="text-secondary" />,
        placeholder: "None",
        isDefault: definition.is_default,
      };
    }
    return options;
  }, [sortedRelationDefinitions]);
};

/**
 * Parse a composite relation key of the format "definitionId::directionName".
 * Returns null if the key is not a composite key (i.e., it's a dependency type).
 */
export const parseRelationKey = (key: string): { definitionId: string; directionName: string } | null => {
  const separatorIndex = key.indexOf("::");
  if (separatorIndex === -1) return null;
  return {
    definitionId: key.substring(0, separatorIndex),
    directionName: key.substring(separatorIndex + 2),
  };
};

export const useTimeLineRelationOptions = () => {
  const { workspaceSlug } = useParams();
  const isDependencyEnabled = useFlag(workspaceSlug.toString(), "TIMELINE_DEPENDENCY");
  const customRelationOptions = useCustomRelationOptions();

  const baseOptions = isDependencyEnabled ? WORK_ITEM_RELATION_OPTIONS : { ...COMMON_WORK_ITEM_RELATION_OPTIONS };

  return { ...baseOptions, ...customRelationOptions };
};
