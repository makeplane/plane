/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { EViewAccess } from "@plane/types";
// components
import { AccessField } from "@/components/common/access-field";
// helpers
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TViewAccessFormValues = { access?: EViewAccess };

export type TAccessControllerProps<T extends TViewAccessFormValues> = {
  control: Control<T>;
};

export function AccessController<T extends TViewAccessFormValues>(props: TAccessControllerProps<T>) {
  const { control } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Controller
      // project and workspace view forms use different form value types, but both share the `access` field
      control={control as unknown as Control<TViewAccessFormValues>}
      name="access"
      render={({ field: { value, onChange } }) => (
        <AccessField
          onChange={onChange}
          value={value ?? EViewAccess.PUBLIC}
          accessSpecifiers={VIEW_ACCESS_SPECIFIERS}
          isMobile={isMobile}
        />
      )}
    />
  );
}
