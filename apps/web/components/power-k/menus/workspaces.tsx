/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React from "react";
// plane imports
import type { IWorkspace } from "@plane/types";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  workspaces: IWorkspace[];
  onSelect: (workspace: IWorkspace) => void;
};

export function PowerKWorkspacesMenu({ workspaces, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <PowerKMenuBuilder
      items={workspaces}
      getKey={(workspace) => workspace.id}
      getIconNode={(workspace) => (
        <WorkspaceLogo logo={workspace.logo_url} name={workspace.name} classNames="shrink-0" />
      )}
      getValue={(workspace) => workspace.name}
      getLabel={(workspace) => workspace.name}
      onSelect={onSelect}
      emptyText={t("web_ui.no_workspaces_found")}
    />
  );
}
