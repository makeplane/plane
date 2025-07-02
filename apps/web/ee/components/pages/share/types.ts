import React from "react";
// plane imports
import { EPageSharedUserAccess } from "@plane/types";
// local imports
import { TPageShareFormReturn } from "@/plane-web/hooks/pages/use-page-share-form";
import { EPageStoreType } from "@/plane-web/hooks/store";
import { TPageSharedUser } from "@/plane-web/services/page/page-share.service";
import { TPageInstance } from "@/store/pages/base-page";

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
