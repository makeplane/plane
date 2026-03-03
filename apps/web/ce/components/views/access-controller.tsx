/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { EViewAccess } from "@plane/types";
import { AccessField } from "@/components/common/access-field";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  control: Control<any>;
};

const VIEW_ACCESS_SPECIFIERS = [
  { key: EViewAccess.PUBLIC, i18n_label: "common.access.public", icon: GlobeIcon },
  { key: EViewAccess.PRIVATE, i18n_label: "common.access.private", icon: LockIcon },
];

export const AccessController: FC<Props> = (props) => {
  const { control } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();

  return (
    <Controller
      control={control}
      name="access"
      render={({ field: { onChange, value } }) => {
        const accessValue = value ?? EViewAccess.PUBLIC;
        const i18nAccessLabel = VIEW_ACCESS_SPECIFIERS.find((access) => access.key === accessValue)?.i18n_label;

        return (
          <div className="flex items-center gap-2">
            <AccessField
              onChange={onChange}
              value={accessValue}
              accessSpecifiers={VIEW_ACCESS_SPECIFIERS}
              isMobile={isMobile}
            />
            <h6 className="text-11 font-medium">{t(i18nAccessLabel || "")}</h6>
          </div>
        );
      }}
    />
  );
};
