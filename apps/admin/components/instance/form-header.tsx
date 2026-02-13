/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function FormHeader({ heading, subHeading }: { heading: string; subHeading: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-20 font-semibold text-primary leading-7">{heading}</span>
      <span className="text-16 font-semibold text-placeholder leading-7">{subHeading}</span>
    </div>
  );
}
