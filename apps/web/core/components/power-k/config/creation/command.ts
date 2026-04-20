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

import { FileText, FolderPlus, Layers, SquarePlus } from "lucide-react";
// plane imports
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { usePowerKPermissions } from "@/components/command-palette/power-k/hooks/use-power-k-permissions";

export type TPowerKCreationCommandKeys =
  | "create_work_item"
  | "create_page"
  | "create_view"
  | "create_cycle"
  | "create_module"
  | "create_project"
  | "create_workspace";

/**
 * Creation commands - Create any entity in the app
 */
export const usePowerKCreationCommandsRecord = (): Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> => {
  // store
  const {
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    toggleCreateCycleModal,
    toggleCreateModuleModal,
    toggleCreateViewModal,
    toggleCreatePageModal,
  } = useCommandPalette();
  const { canCreateResource } = usePowerKPermissions();

  return {
    create_work_item: {
      id: "create_work_item",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_work_item",
      icon: LayersIcon,
      keySequence: "ni",
      action: () => toggleCreateIssueModal(true),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_work_item"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_work_item"),
      closeOnSelect: true,
    },
    create_page: {
      id: "create_page",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_page",
      icon: FileText,
      keySequence: "nd",
      action: () => toggleCreatePageModal({ isOpen: true }),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_page"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_page"),
      closeOnSelect: true,
    },
    create_view: {
      id: "create_view",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_view",
      icon: Layers,
      keySequence: "nv",
      action: () => toggleCreateViewModal(true),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_view"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_view"),
      closeOnSelect: true,
    },
    create_cycle: {
      id: "create_cycle",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_cycle",
      icon: ContrastIcon,
      keySequence: "nc",
      action: () => toggleCreateCycleModal(true),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_cycle"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_cycle"),
      closeOnSelect: true,
    },
    create_module: {
      id: "create_module",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_module",
      icon: DiceIcon,
      keySequence: "nm",
      action: () => toggleCreateModuleModal(true),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_module"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_module"),
      closeOnSelect: true,
    },
    create_project: {
      id: "create_project",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_project",
      icon: FolderPlus,
      keySequence: "np",
      action: () => toggleCreateProjectModal(true),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_project"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_project"),
      closeOnSelect: true,
    },
    create_workspace: {
      id: "create_workspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_workspace",
      icon: SquarePlus,
      action: (ctx) => ctx.router.push("/create-workspace"),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace"),
      closeOnSelect: true,
    },
  };
};
