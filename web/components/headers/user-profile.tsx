// ui
import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronDown, PanelRight } from "lucide-react";
import { Breadcrumbs, CustomMenu } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common";
// components
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "@/constants/profile";
import { cn } from "@/helpers/common.helper";
import { useAppTheme, useUser } from "@/hooks/store";

type TUserProfileHeader = {
  type?: string | undefined;
};

export const UserProfileHeader: FC<TUserProfileHeader> = observer((props) => {
  const { type = undefined } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;
  // store hooks
  const { toggleProfileSidebar, profileSidebarCollapsed } = useAppTheme();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const AUTHORIZED_ROLES = [20, 15, 10];

  if (!currentWorkspaceRole) return null;

  const isAuthorized = AUTHORIZED_ROLES.includes(currentWorkspaceRole);
  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex w-full justify-between">
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink href="/profile" label="Activity Overview" />}
            />
          </Breadcrumbs>
          <div className="flex gap-4 md:hidden">
            <CustomMenu
              maxHeight={"md"}
              className="flex flex-grow justify-center text-sm text-custom-text-200"
              placement="bottom-start"
              customButton={
                <div className="flex items-center gap-2 rounded-md border border-custom-border-400 px-2 py-1.5">
                  <span className="flex flex-grow justify-center text-sm text-custom-text-200">{type}</span>
                  <ChevronDown className="h-4 w-4 text-custom-text-400" />
                </div>
              }
              customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
              closeOnSelect
            >
              <></>
              {tabsList.map((tab) => (
                <CustomMenu.MenuItem className="flex items-center gap-2" key={tab.route}>
                  <Link
                    key={tab.route}
                    href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}
                    className="w-full text-custom-text-300"
                  >
                    {tab.label}
                  </Link>
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
            <button
              className="block transition-all md:hidden"
              onClick={() => {
                toggleProfileSidebar();
              }}
            >
              <PanelRight
                className={cn(
                  "block h-4 w-4 md:hidden",
                  !profileSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
