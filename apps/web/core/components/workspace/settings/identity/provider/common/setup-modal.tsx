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

import { X } from "lucide-react";
// plane imports
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { IconButton } from "@plane/propel/icon-button";
// local imports
import { ProviderDetailsTabs } from "./details-tabs";

type TTab<TKey extends string> = {
  key: TKey;
  label: string;
  content: React.ReactNode;
};

type TProviderSetupModalProps<TKey extends string> = {
  isOpen: boolean;
  onClose: () => void;
  tabs: readonly TTab<TKey>[];
};

export function ProviderSetupModal<TKey extends string>(props: TProviderSetupModalProps<TKey>) {
  const { isOpen, onClose, tabs } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XXL} position={EModalPosition.TOP}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h6 className="text-h6-medium text-primary">Setup details</h6>
          <IconButton variant="ghost" size="lg" onClick={onClose} icon={X} />
        </div>
        <ProviderDetailsTabs tabs={tabs} />
      </div>
    </ModalCore>
  );
}
