/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";

type TFieldPermissionRowProps = {
  titleKey: string;
  descriptionKey: string;
  value: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export const FieldPermissionRow = observer(function FieldPermissionRow({
  titleKey,
  descriptionKey,
  value,
  disabled,
  onToggle,
}: TFieldPermissionRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-layer-2 px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-primary">{t(titleKey)}</span>
        <span className="text-xs text-secondary">{t(descriptionKey)}</span>
      </div>
      <Switch value={value} onChange={() => onToggle()} disabled={disabled} />
    </div>
  );
});
