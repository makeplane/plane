import { FC, ReactNode } from "react";
// layout
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronDown } from "lucide-react";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { SidebarHamburgerToggle } from "@/components/core/sidebar";
// hooks
import { useAppTheme } from "@/hooks/store";
// layouts
import { ProfileSettingsLayout } from "@/layouts/settings-layout";
// local components
import { ProfilePreferenceSettingsSidebar } from "./sidebar";

interface IProfilePreferenceSettingsLayout {
  children: ReactNode;
  header?: ReactNode;
}

export const ProfilePreferenceSettingsLayout: FC<IProfilePreferenceSettingsLayout> = (props) => {
  const { children, header } = props;
  // router
  const router = useRouter();
  // store hooks
  const { toggleSidebar } = useAppTheme();

  const showMenuItem = () => {
    const item = router.asPath.split("/");
    let splittedItem = item[item.length - 1];
    splittedItem = splittedItem.replace(splittedItem[0], splittedItem[0].toUpperCase());
    return splittedItem;
  };

  const PROFILE_PREFERENCES_LINKS: Array<{
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
    <ProfileSettingsLayout
      header={
        <div className="flex flex-shrink-0 items-center justify-start gap-4 border-b border-custom-border-200 p-4 md:hidden">
          <SidebarHamburgerToggle onClick={() => toggleSidebar()} />
          <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-sm text-custom-text-200"
            placement="bottom-start"
            customButton={
              <div className="flex items-center gap-2 rounded-md border border-custom-border-400 px-2 py-1.5">
                <span className="flex flex-grow justify-center text-sm text-custom-text-200">{showMenuItem()}</span>
                <ChevronDown className="h-4 w-4 text-custom-text-400" />
              </div>
            }
            customButtonClassName="flex flex-grow justify-start text-custom-text-200 text-sm"
          >
            {PROFILE_PREFERENCES_LINKS.map((link) => (
              <CustomMenu.MenuItem className="flex items-center gap-2" key={link.href}>
                <Link key={link.href} href={link.href} className="w-full text-custom-text-300">
                  {link.label}
                </Link>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </div>
      }
    >
      <div className="relative flex h-screen w-full overflow-hidden">
        <ProfilePreferenceSettingsSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          {header}
          <div className="h-full w-full overflow-hidden">{children}</div>
        </main>
      </div>
    </ProfileSettingsLayout>
  );
};
