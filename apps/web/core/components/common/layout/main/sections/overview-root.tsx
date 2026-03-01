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

import type { FC } from "react";
import React from "react";
// local components
import { SectionWrapper } from "../common/section-wrapper";

type TOverviewSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function OverviewSection(props: TOverviewSectionProps) {
  const { children, title } = props;
  return (
    <SectionWrapper>
      <div className="flex items-center">
        <span className="text-14 text-tertiary font-medium">{title}</span>
      </div>
      <>{children}</>
    </SectionWrapper>
  );
}
