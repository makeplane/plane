/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useViewPublish = (isPublished: boolean, isAuthorized: boolean) => ({
  isPublishModalOpen: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPublishModalOpen: (value: boolean) => {},
  publishContextMenu: undefined,
});
