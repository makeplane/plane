import { FC } from "react";
import { useTheme } from "next-themes";
// hooks
import { useEventTracker, useUser } from "hooks/store";
// components
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { PAGE_EMPTY_STATE_DETAILS } from "constants/empty-state";

type TPageEmptyState = {
  callback: () => void;
};

export const PageEmptyState: FC<TPageEmptyState> = (props) => {
  const { callback } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // hooks
  const { setTrackElement } = useEventTracker();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "pages", isLightMode);
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <EmptyState
      image={EmptyStateImagePath}
      title={PAGE_EMPTY_STATE_DETAILS["pages"].title}
      description={PAGE_EMPTY_STATE_DETAILS["pages"].description}
      primaryButton={{
        text: PAGE_EMPTY_STATE_DETAILS["pages"].primaryButton.text,
        onClick: () => {
          setTrackElement("Pages empty state");
          callback && callback();
          // toggleCreatePageModal(true);
        },
      }}
      comicBox={{
        title: PAGE_EMPTY_STATE_DETAILS["pages"].comicBox.title,
        description: PAGE_EMPTY_STATE_DETAILS["pages"].comicBox.description,
      }}
      size="lg"
      disabled={!isEditingAllowed}
    />
  );
};
