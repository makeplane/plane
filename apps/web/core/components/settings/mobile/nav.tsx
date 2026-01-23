import { useRef } from "react";
import { observer } from "mobx-react";
import { Menu } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { useUserSettings } from "@/hooks/store/user";
import { IconButton } from "@plane/propel/icon-button";

type Props = {
  hamburgerContent: React.ComponentType<{ className?: string; isMobile?: boolean }>;
  activePath: string;
};

export const SettingsMobileNav = observer(function SettingsMobileNav(props: Props) {
  const { hamburgerContent: HamburgerContent, activePath } = props;
  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useUserSettings();
  const { t } = useTranslation();

  useOutsideClickDetector(sidebarRef, () => {
    if (!sidebarCollapsed) toggleSidebar(true);
  });

  return (
    <div className="md:hidden border-b border-subtle py-3 flex items-center gap-4 px-page-x">
      <div ref={sidebarRef} className="relative w-fit z-50">
        {!sidebarCollapsed && (
          <div className="absolute left-0 top-10.5 z-50">
            <HamburgerContent className="max-h-100 pb-3 border border-subtle rounded-lg" />
          </div>
        )}
        <IconButton variant="secondary" className="z-50 group shrink-0" icon={Menu} onClick={() => toggleSidebar()} />
      </div>
      {/* path */}
      <div className="flex items-center gap-2">
        <ChevronRightIcon className="size-4 text-tertiary" />
        <span className="text-13 font-medium text-secondary">{t(activePath)}</span>
      </div>
    </div>
  );
});
