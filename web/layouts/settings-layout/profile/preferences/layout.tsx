import { FC, ReactNode } from "react";
// layout
import { ProfileSettingsLayout } from "layouts/settings-layout";
import { ProfilePreferenceSettingsSidebar } from "./sidebar";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { CustomMenu } from "@plane/ui";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useApplication } from "hooks/store";

interface IProfilePreferenceSettingsLayout {
  children: ReactNode;
  header?: ReactNode;
}

export const ProfilePreferenceSettingsLayout: FC<IProfilePreferenceSettingsLayout> = (props) => {
  const { children, header } = props;
  const router = useRouter();
  const { theme: themeStore } = useApplication();

  const showMenuItem = () => {
    const item = router.asPath.split('/');
    let splittedItem = item[item.length - 1];
    splittedItem = splittedItem.replace(splittedItem[0], splittedItem[0].toUpperCase());
    console.log(splittedItem);
    return splittedItem;
  }

  const profilePreferenceLinks: Array<{
    label: string;
    href: string;
  }> = [
      {
        label: "Theme",
        href: `/profile/preferences/theme`,
      },
      {
        label: "Email",
        href: `/profile/preferences/email`,
      },
    ];

  return (
    <ProfileSettingsLayout header={
      <div className="md:hidden flex flex-shrink-0 gap-4 items-center justify-start border-b border-custom-border-200 p-4">
        <SidebarHamburgerToggle onClick={() => themeStore.toggleSidebar()} />
        <CustomMenu
          maxHeight={"md"}
          className="flex flex-grow justify-center text-custom-text-200 text-sm"
          placement="bottom-start"
          customButton={
            <div className="flex gap-2 items-center px-2 py-1.5 border rounded-md border-custom-border-400">
              <span className="flex flex-grow justify-center text-custom-text-200 text-sm">{showMenuItem()}</span>
              <ChevronDown className="w-4 h-4 text-custom-text-400" />
            </div>
          }
          customButtonClassName="flex flex-grow justify-start text-custom-text-200 text-sm"
        >
          <></>
          {profilePreferenceLinks.map((link) => (
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
            >
              <Link key={link.href} href={link.href} className="text-custom-text-300 w-full">{link.label}</Link>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
    }>
      <div className="relative flex h-screen w-full overflow-hidden">
        <ProfilePreferenceSettingsSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          {header}
          <div className="h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
        </main>
      </div>
    </ProfileSettingsLayout>
  );
};
