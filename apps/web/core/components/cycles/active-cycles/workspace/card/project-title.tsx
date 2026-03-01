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

// types
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { IProject } from "@plane/types";

export type ActiveCyclesProjectTitleProps = {
  project: Partial<IProject> | undefined;
};

export function ActiveCyclesProjectTitle(props: ActiveCyclesProjectTitleProps) {
  const { project } = props;
  return (
    <div className="flex items-center gap-2 px-3">
      {project?.logo_props && <Logo logo={project.logo_props} />}
      <h2 className="text-18 font-semibold">{project?.name}</h2>
    </div>
  );
}
