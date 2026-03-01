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
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IProjectView, IWorkspaceView } from "@plane/types";
// components
import { AccessField } from "@/components/common/access-field";
// constants
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  control: Control<IProjectView, any> | Control<IWorkspaceView, any>;
};
export function AccessController(props: Props) {
  const { control } = props;
  // plane web hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const isPrivateViewsEnabled = useFlag(workspaceSlug?.toString(), "VIEW_ACCESS_PRIVATE");

  if (!isPrivateViewsEnabled) return null;

  return (
    <Controller
      control={control as Control<IProjectView, any>}
      name="access"
      render={({ field: { onChange, value } }) => (
        <AccessField onChange={onChange} value={value} accessSpecifiers={VIEW_ACCESS_SPECIFIERS} />
      )}
    />
  );
}
