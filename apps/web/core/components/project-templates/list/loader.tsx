/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Loader } from "@plane/ui";

/**
 * Skeleton loader for the project templates list.
 * Mirrors the labels list-loader idiom (Loader.Item height="42px" rows).
 */
export function ProjectTemplatesListLoader() {
  return (
    <Loader className="space-y-5">
      <Loader.Item height="42px" />
      <Loader.Item height="42px" />
      <Loader.Item height="42px" />
      <Loader.Item height="42px" />
    </Loader>
  );
}
