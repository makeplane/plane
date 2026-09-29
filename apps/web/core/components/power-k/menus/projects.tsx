/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// components
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
// plane imports
import type { TPartialProject } from "@/plane-web/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  projects: TPartialProject[];
  onSelect: (project: TPartialProject) => void;
};

export function PowerKProjectsMenu({ projects, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <PowerKMenuBuilder
      items={projects}
      getKey={(project) => project.id}
      getIconNode={(project) => (
        <span className="shrink-0">
          <Logo logo={project.logo_props} size={14} />
        </span>
      )}
      getValue={(project) => project.name}
      getLabel={(project) => project.name}
      onSelect={onSelect}
      emptyText={t("power_k_ui.empty_menu.projects")}
    />
  );
}
