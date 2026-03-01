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

import type React from "react";
// plane imports
import type { EPageSharedUserAccess } from "@plane/types";
// local imports
import type { TPageShareFormReturn } from "@/plane-web/hooks/pages/use-page-share-form";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import type { TPageSharedUser } from "@/services/page/page-share.service";
import type { TPageInstance } from "@/store/pages/base-page";

export type TSharePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
  shareForm: TPageShareFormReturn;
  isSharedUsersAccordionOpen: boolean;
  onToggleSharedUsersAccordion: () => void;
};

export type TPageSharedUserResponse = {
  id?: string;
  user_id: string;
  access: EPageSharedUserAccess;
  created_at?: string;
  updated_at?: string;
};

export type TPendingSharedUser = {
  user_id: string;
  access: EPageSharedUserAccess;
};

export type TModifiedSharedUser = {
  user_id: string;
  originalAccess: EPageSharedUserAccess;
  newAccess: EPageSharedUserAccess;
};

// Legacy aliases for backward compatibility
export type TPendingCollaborator = TPendingSharedUser;
export type TModifiedCollaborator = TModifiedSharedUser;

export type TSearchOption = {
  value: string;
  query: string;
  content: React.ReactNode;
};

// Export the service types for components to use
export type { TPageSharedUser, EPageSharedUserAccess };
