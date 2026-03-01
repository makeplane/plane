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

type TIdentitySettingsSectionProps = {
  sectionTitle: string;
  children?: React.ReactNode;
  showBorder?: boolean;
};

export function IdentitySettingsSection(props: TIdentitySettingsSectionProps) {
  const { sectionTitle, children } = props;

  return (
    <div className={"w-full flex flex-col gap-8 bg-layer-transparent"}>
      {/* Section title */}
      <h5 className="text-h5-medium text-primary">{sectionTitle}</h5>
      {/* Section content */}
      {children}
    </div>
  );
}
