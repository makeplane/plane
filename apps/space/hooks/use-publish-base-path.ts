/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// hooks
import { usePublish } from "@/hooks/store/publish";

/**
 * Returns the base path of the published entity for the given anchor,
 * depending on the entity type of its publish settings.
 * @param anchor
 */
export const usePublishBasePath = (anchor: string): string => {
  const publishSettings = usePublish(anchor);
  return publishSettings?.entity_name === "view" ? `/views/${anchor}` : `/issues/${anchor}`;
};
