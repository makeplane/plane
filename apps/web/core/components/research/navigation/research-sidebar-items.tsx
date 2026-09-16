/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRightOutline } from "@makeplane/propel/icons";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { RESEARCH_NAVIGATION_ITEMS, RESEARCH_SETTINGS_NAVIGATION_ITEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import useLocalStorage from "@/hooks/use-local-storage";

/** Collapse state of the research group; mirrors the workspace / projects groups. */
const RESEARCH_MENU_OPEN_KEY = "is_research_menu_open";

/**
 * Research navigation block.
 *
 * Purely additive: existing sidebar entries keep their order and behaviour
 * (P0-UI-01, P0-UI-08). When the workspace switch is off or the caller has no
 * research role the block renders nothing (P0-UI-06, P0-UI-07).
 *
 * The group itself collapses and expands like the workspace / projects groups,
 * and the choice is remembered per browser.
 */
export const ResearchSidebarItems = observer(function ResearchSidebarItems() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const research = useResearch();
  // local storage
  const { storedValue: storedIsMenuOpen, setValue: setIsMenuOpen } = useLocalStorage<boolean>(
    RESEARCH_MENU_OPEN_KEY,
    true
  );

  // default to expanded before the stored value is hydrated
  const isMenuOpen = storedIsMenuOpen ?? true;

  useEffect(() => {
    if (workspaceSlug && !research.identity) {
      void research.fetchIdentity(workspaceSlug).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (!workspaceSlug || !research.isEnabled) return null;

  const sections = research.identity?.sections;
  const visibleBusinessItems = RESEARCH_NAVIGATION_ITEMS.filter((item) => Boolean(sections?.[item.section]));
  const visibleSettingsItems = research.isWorkspaceAdmin
    ? RESEARCH_SETTINGS_NAVIGATION_ITEMS.filter((item) => Boolean(sections?.[item.section]))
    : [];

  const menuAriaLabel = t(
    isMenuOpen ? "aria_labels.projects_sidebar.close_research_menu" : "aria_labels.projects_sidebar.open_research_menu"
  );

  const toggleMenu = (isOpen: boolean) => setIsMenuOpen(isOpen);

  const renderItem = (key: string, labelKey: string, path: string) => {
    const href = `/${workspaceSlug}/research/${path}`;
    const isActive = pathname?.startsWith(href);
    return (
      <Link
        key={key}
        href={href}
        className={`flex items-center rounded-md px-2 py-1.5 text-13 transition-colors ${
          isActive ? "bg-surface-2 text-primary" : "text-secondary hover:bg-surface-2"
        }`}
      >
        {t(labelKey)}
      </Link>
    );
  };

  return (
    <Disclosure as="div" className="mt-3 flex flex-col border-t border-subtle pt-3" defaultOpen={isMenuOpen}>
      <div className="group flex w-full items-center justify-between rounded-sm px-2 py-1.5 hover:bg-layer-transparent-hover">
        <Disclosure.Button
          as="button"
          type="button"
          className="flex w-full items-center gap-1 text-left text-13 font-semibold whitespace-nowrap text-placeholder"
          onClick={() => toggleMenu(!isMenuOpen)}
          aria-label={menuAriaLabel}
          aria-expanded={isMenuOpen}
        >
          <span className="text-13 font-semibold">{t("research.nav.group")}</span>
        </Disclosure.Button>
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronRightOutline}
            onClick={() => toggleMenu(!isMenuOpen)}
            className="text-placeholder"
            iconClassName={cn("transition-transform", {
              "rotate-90": isMenuOpen,
            })}
            aria-label={menuAriaLabel}
          />
        </div>
      </div>
      <Transition
        as="div"
        show={isMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isMenuOpen && (
          <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
            {renderItem("overview", "research.nav.overview", "")}
            {visibleBusinessItems.map((item) => renderItem(item.key, item.labelKey, item.path))}
            {visibleSettingsItems.map((item) => renderItem(item.key, item.labelKey, item.path))}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
