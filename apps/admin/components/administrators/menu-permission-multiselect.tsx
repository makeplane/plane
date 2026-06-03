/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { useUser } from "@/hooks/store";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "@/hooks/use-sidebar-menu";
import type { TPermissionKey } from "@/hooks/use-sidebar-menu";

type TProps = {
  value: string[];
  onChange: (menus: string[]) => void;
};

/**
 * Checkbox grid for menu grants. Non-super callers may only grant menus
 * they hold themselves (server-enforced; mirrored here as disabled rows).
 */
export const MenuPermissionMultiselect = observer(({ value, onChange }: TProps) => {
  const { currentUser } = useUser();

  const callerIsSuper = currentUser?.is_super_admin ?? false;
  const callerMenus = new Set(currentUser?.allowed_menus ?? []);

  const isGrantable = (key: TPermissionKey) => callerIsSuper || callerMenus.has(key);

  const toggle = (key: TPermissionKey) => {
    if (!isGrantable(key)) return;
    onChange(value.includes(key) ? value.filter((menu) => menu !== key) : [...value, key]);
  };

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {PERMISSION_KEYS.map((key) => {
        const grantable = isGrantable(key);
        return (
          <label
            key={key}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-13 ${
              grantable ? "cursor-pointer text-primary hover:bg-layer-1-hover" : "cursor-not-allowed text-disabled"
            }`}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-current"
              checked={value.includes(key)}
              disabled={!grantable}
              onChange={() => toggle(key)}
            />
            <span className="truncate" title={PERMISSION_LABELS[key]}>
              {PERMISSION_LABELS[key]}
            </span>
          </label>
        );
      })}
    </div>
  );
});
