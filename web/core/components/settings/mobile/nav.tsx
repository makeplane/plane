import { useRef } from "react";
import { observer } from "mobx-react";
import { ChevronRight, Menu } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { useUserSettings } from "@/hooks/store";

type Props = {
  hamburgerContent: React.ComponentType<{ isMobile: boolean }>;
  activePath: string;
};

export const SettingsMobileNav = observer((props: Props) => {
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
    <div className="md:hidden">
      <div className="border-b border-custom-border-100 py-3 flex items-center gap-4">
        <div ref={sidebarRef} className="relative w-fit">
          {!sidebarCollapsed && <HamburgerContent isMobile />}
          <button
            type="button"
            className="z-50  group flex-shrink-0 size-6 grid place-items-center rounded border border-custom-border-200 transition-all bg-custom-background md:hidden"
            onClick={() => toggleSidebar()}
          >
            <Menu className="size-3.5 text-custom-text-200 transition-all group-hover:text-custom-text-100" />
          </button>
        </div>
        {/* path */}
        <div className="flex items-center gap-2">
          <ChevronRight className="size-4 text-custom-text-300" />
          <span className="text-sm font-medium text-custom-text-200">{t(activePath)}</span>
        </div>
      </div>
    </div>
  );
});
