import { useMemo } from "react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { DEFAULT_TAB_KEY } from "./tab-navigation-utils";
import type { TTabPreferences } from "./tab-navigation-utils";

export type TTabPreferencesHook = {
  tabPreferences: TTabPreferences;
  isLoading: boolean;
  handleToggleDefaultTab: (tabKey: string) => void;
  handleHideTab: (tabKey: string) => void;
  handleShowTab: (tabKey: string) => void;
};

/**
 * Custom hook to manage tab preferences for a project
 * Uses MobX store for state management and API persistence
 *
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project ID
 * @returns Tab preferences state and handlers
 */
export const useTabPreferences = (workspaceSlug: string, projectId: string): TTabPreferencesHook => {
  const {
    project: { getProjectMemberPreferences, updateProjectMemberPreferences },
  } = useMember();
  // const { projectUserInfo } = useUserPermissions();
  const { data } = useUser();

  // Get member ID from projectUserInfo
  // const projectMemberInfo = projectUserInfo[workspaceSlug]?.[projectId];
  const memberId = data?.id || null;

  // Get preferences from store
  const storePreferences = getProjectMemberPreferences(projectId);

  // Convert store preferences to component format
  const tabPreferences: TTabPreferences = useMemo(() => {
    if (storePreferences) {
      return {
        defaultTab: storePreferences.default_tab || DEFAULT_TAB_KEY,
        hiddenTabs: storePreferences.hide_in_more_menu || [],
      };
    }
    return {
      defaultTab: DEFAULT_TAB_KEY,
      hiddenTabs: [],
    };
  }, [storePreferences]);

  const isLoading = !storePreferences && memberId !== null;

  /**
   * Update preferences via store
   */
  const updatePreferences = async (newPreferences: TTabPreferences) => {
    if (!memberId) return;

    try {
      await updateProjectMemberPreferences(workspaceSlug, projectId, memberId, {
        default_tab: newPreferences.defaultTab,
        hide_in_more_menu: newPreferences.hiddenTabs,
      });
    } catch (error) {
      console.error("Error updating tab preferences:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  /**
   * Toggle default tab setting
   * If tab is already default, resets to work_items; otherwise sets as default
   */
  const handleToggleDefaultTab = (tabKey: string) => {
    const newDefaultTab = tabKey === tabPreferences.defaultTab ? DEFAULT_TAB_KEY : tabKey;
    const newPreferences = { ...tabPreferences, defaultTab: newDefaultTab };
    updatePreferences(newPreferences);
  };

  /**
   * Hide a tab (moves to overflow menu with "Show" option)
   */
  const handleHideTab = (tabKey: string) => {
    const newPreferences = {
      ...tabPreferences,
      hiddenTabs: [...tabPreferences.hiddenTabs, tabKey],
    };
    updatePreferences(newPreferences);
  };

  /**
   * Show a previously hidden tab (returns to visible pool)
   */
  const handleShowTab = (tabKey: string) => {
    const newPreferences = {
      ...tabPreferences,
      hiddenTabs: tabPreferences.hiddenTabs.filter((key) => key !== tabKey),
    };
    updatePreferences(newPreferences);
  };

  return {
    tabPreferences,
    isLoading,
    handleToggleDefaultTab,
    handleHideTab,
    handleShowTab,
  };
};
