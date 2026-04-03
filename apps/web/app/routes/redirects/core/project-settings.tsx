/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { redirect } from "react-router";
import type { Route } from "./+types/project-settings";

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
  const { workspaceSlug, projectId } = params;
  const splat = params["*"] || "";
  const destination = `/${workspaceSlug}/settings/projects/${projectId}${splat ? `/${splat}` : ""}/`;
  throw redirect(destination);
};

export default function ProjectSettings() {
  return null;
}
