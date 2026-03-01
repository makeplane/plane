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

import { ChevronRightIcon } from "@plane/propel/icons";
import { EPillVariant, Pill, EPillSize } from "@plane/propel/pill";
import { Switch } from "@plane/propel/switch";
import type { TProperties } from "@/constants/project/settings/features";

type Props = {
  featureItem: TProperties;
  value: boolean;
  handleSubmit: (featureKey: string, featureProperty: string) => void;
  disabled?: boolean;
  isCreateModal?: boolean;
};

export function ProjectFeatureToggle(props: Props) {
  const { featureItem, value, handleSubmit, disabled, isCreateModal } = props;

  const handleToggle = () => {
    handleSubmit(featureItem.key, featureItem.property);
  };

  // Switch props
  const toggleSwitchProps = {
    value,
    onChange: handleToggle,
    disabled,
  };

  if (isCreateModal) {
    return <Switch {...toggleSwitchProps} />;
  }

  if (featureItem.href) {
    return (
      <div className="flex items-center gap-2">
        <Pill
          variant={value ? EPillVariant.PRIMARY : EPillVariant.DEFAULT}
          size={EPillSize.SM}
          className="border-none rounded-lg"
        >
          {value ? "Enabled" : "Disabled"}
        </Pill>
        <ChevronRightIcon className="h-4 w-4 text-tertiary" />
      </div>
    );
  }

  return <Switch {...toggleSwitchProps} />;
}
