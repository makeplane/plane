/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type ProjectIdentifierElementProps = {
  identifier?: string;
  show?: boolean;
};

/** Owning project's short code, shown as a pill for pickers scoped across several projects. */
export function ProjectIdentifierElement({ identifier, show }: ProjectIdentifierElementProps) {
  if (!show || !identifier) return null;
  return <span className="shrink-0 text-caption-md-medium text-secondary">{identifier}</span>;
}
