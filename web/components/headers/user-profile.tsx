// ui
import { Breadcrumbs, CustomMenu } from "@plane/ui";
import { BreadcrumbLink } from "components/common";
// components
import { cn } from "helpers/common.helper";
import { FC } from "react";
import { useApplication, useUser } from "hooks/store";
import { ChevronDown, PanelRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "constants/profile";
import Link from "next/link";
import { useRouter } from "next/router";

type TUserProfileHeader = {
  type?: string | undefined
}

export const UserProfileHeader: FC<TUserProfileHeader> = observer((props) => {
  const { type = undefined } = props

  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const AUTHORIZED_ROLES = [20, 15, 10];
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  if (!currentWorkspaceRole) return null;

  const isAuthorized = AUTHORIZED_ROLES.includes(currentWorkspaceRole);
  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  const { theme: themStore } = useApplication();

  return (<div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
    <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
      <div className="flex justify-between w-full">
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink href="/profile" label="Activity Overview" />} />
        </Breadcrumbs>
        <div className="flex gap-4 md:hidden">
          <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-custom-text-200 text-sm"
            placement="bottom-start"
            customButton={
              <div className="flex gap-2 items-center px-2 py-1.5 border border-custom-border-400 rounded-md">
                <span className="flex flex-grow justify-center text-custom-text-200 text-sm">{type}</span>
                <ChevronDown className="w-4 h-4 text-custom-text-400" />
              </div>
            }
            customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
            closeOnSelect
          >
            <></>
            {tabsList.map((tab) => (
              <CustomMenu.MenuItem
                className="flex items-center gap-2"
              >
                <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`} className="text-custom-text-300 w-full">{tab.label}</Link>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
          <button className="transition-all block md:hidden" onClick={() => { themStore.toggleProfileSidebar() }}>
            <PanelRight className={
              cn("w-4 h-4 block md:hidden", !themStore.profileSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200")
            } />
          </button>
        </div>
      </div>
    </div>
  </div>)
});


