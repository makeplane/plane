/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";

type Props = {
  title: string;
  description: string;
};

export function CommonOnboardingHeader({ title, description }: Props) {
  return (
    <div className="text-left space-y-2">
      <h1 className="text-h4-semibold text-primary">{title}</h1>
      <p className="text-body-md-regular text-tertiary">{description}</p>
    </div>
  );
}
