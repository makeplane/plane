// plane web types
import { TSidebarUserMenuItemKeys, TSidebarWorkspaceMenuItemKeys } from "@/plane-web/types/dashboard";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isUserFeatureEnabled = (featureKey: TSidebarUserMenuItemKeys) => true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isWorkspaceFeatureEnabled = (featureKey: TSidebarWorkspaceMenuItemKeys, workspaceSlug: string) => true;
