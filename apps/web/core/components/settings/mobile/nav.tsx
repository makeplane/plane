/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
    <div className="flex items-center gap-4 border-b border-subtle px-page-x py-3 md:hidden">
      <div ref={sidebarRef} className="relative z-50 w-fit">
        {!sidebarCollapsed && (
          <div className="absolute top-10.5 left-0 z-50">
            <HamburgerContent className="max-h-100 rounded-lg border border-subtle pb-3" />
          </div>
        )}
        <IconButton variant="secondary" className="group z-50 shrink-0" icon={Menu} onClick={() => toggleSidebar()} />
      </div>
      {/* path */}
      <div className="flex items-center gap-2">
        <ChevronRightIcon className="size-4 text-tertiary" />
        <span className="text-13 font-medium text-secondary">{t(activePath)}</span>
      </div>
    </div>
  );
});
