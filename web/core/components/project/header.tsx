"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Search, Briefcase, X } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useCommandPalette, useEventTracker, useProjectFilter, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import HeaderFilters from "./filters";

export const ProjectsBaseHeader = observer(() => {
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const pathname = usePathname();

  const { searchQuery, updateSearchQuery } = useProjectFilter();

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });
  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isArchived = pathname.includes("/archives");

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Projects" icon={<Briefcase className="h-4 w-4 text-custom-text-300" />} />}
          />
          {isArchived && <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Archived" />} />}
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center">
          {!isSearchOpen && (
            <button
              type="button"
              className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
              onClick={() => {
                setIsSearchOpen(true);
                inputRef.current?.focus();
              }}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}
          <div
            className={cn(
              "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
              {
                "w-30 md:w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
              }
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              ref={inputRef}
              className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {isSearchOpen && (
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  updateSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:flex">
          <HeaderFilters />
        </div>
        {isAuthorizedUser && !isArchived ? (
          <Button
            size="sm"
            onClick={() => {
              setTrackElement("Projects page");
              toggleCreateProjectModal(true);
            }}
            className="items-center gap-1"
          >
            <span className="hidden sm:inline-block">Add</span> Project
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
