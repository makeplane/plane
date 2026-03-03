/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function AuthFormHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-20 font-semibold text-primary">{title}</span>
      <span className="text-20 font-semibold text-placeholder">{description}</span>
    </div>
  );
}
