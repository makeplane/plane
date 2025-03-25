"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { FileText, FolderPlus, Search, Settings } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// components
import { CommandPaletteThemeActions, CommandPaletteHelpActions } from "@/components/command-palette";
import { SimpleEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette } from "@/hooks/store";
import useDebounce from "@/hooks/use-debounce";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { PagesAppCommandPaletteSearchResults } from "@/plane-web/components/command-palette";
import { AppService } from "@/plane-web/services/app.service";
import { IAppSearchResults } from "@/plane-web/types";

const appService = new AppService();

type Props = {
  workspaceSlug: string;
};

export const PagesAppCommandModal: React.FC<Props> = observer((props) => {
  const { workspaceSlug } = props;
  // router
  const router = useRouter();
  // states
  const [placeholder, setPlaceholder] = useState("Type a command or search...");
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IAppSearchResults>({
    results: {
      workspace: [],
      page: [],
    },
  });
  const [pages, setPages] = useState<string[]>([]);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isCommandPaletteOpen, toggleCommandPaletteModal, toggleCreatePageModal } = useCommandPalette();
  // derived values
  const page = pages[pages.length - 1];
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const closePalette = () => {
    toggleCommandPaletteModal(false);
  };

  const createNewWorkspace = () => {
    closePalette();
    router.push("/create-workspace");
  };

  useEffect(
    () => {
      if (!workspaceSlug) return;

      setIsLoading(true);

      if (debouncedSearchTerm) {
        setIsSearching(true);
        appService
          .searchApp(workspaceSlug.toString(), {
            search: debouncedSearchTerm,
          })
          .then((results) => {
            setResults(results);
            const count = Object.keys(results.results).reduce(
              (accumulator, key) => (results.results as any)[key].length + accumulator,
              0
            );
            setResultsCount(count);
          })
          .finally(() => {
            setIsLoading(false);
            setIsSearching(false);
          });
      } else {
        setResults({
          results: {
            workspace: [],
            page: [],
          },
        });
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [debouncedSearchTerm, workspaceSlug] // Only call effect if debounced search term changes
  );

  return (
    <Transition.Root show={isCommandPaletteOpen} afterLeave={() => setSearchTerm("")} as={React.Fragment}>
      <Dialog as="div" className="relative z-30" onClose={() => closePalette()}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className="flex items-center justify-center p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-2xl transform items-center justify-center divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <div className="w-full max-w-2xl">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                    onKeyDown={(e) => {
                      // when search term is not empty, esc should clear the search term
                      if (e.key === "Escape" && searchTerm) setSearchTerm("");

                      // when user tries to close the modal with esc
                      if (e.key === "Escape" && !page && !searchTerm) closePalette();

                      // Escape goes to previous page
                      // Backspace goes to previous page when search is empty
                      if (e.key === "Escape" || (e.key === "Backspace" && !searchTerm)) {
                        e.preventDefault();
                        setPages((pages) => pages.slice(0, -1));
                        setPlaceholder("Type a command or search...");
                      }
                    }}
                  >
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-200"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                      <Command.Input
                        className="w-full border-0 border-b border-custom-border-200 bg-transparent p-4 pl-11 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                        placeholder={placeholder}
                        value={searchTerm}
                        onValueChange={(e) => setSearchTerm(e)}
                        autoFocus
                        tabIndex={1}
                      />
                    </div>

                    <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
                      {searchTerm !== "" && (
                        <h5 className="mx-[3px] my-4 text-xs text-custom-text-100">
                          Search results for{" "}
                          <span className="font-medium">
                            {'"'}
                            {searchTerm}
                            {'"'}
                          </span>{" "}
                          in workspace
                        </h5>
                      )}

                      {!isLoading && resultsCount === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
                        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
                          <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
                        </div>
                      )}

                      {(isLoading || isSearching) && (
                        <Command.Loading>
                          <Loader className="space-y-3">
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                          </Loader>
                        </Command.Loading>
                      )}

                      {debouncedSearchTerm !== "" && (
                        <PagesAppCommandPaletteSearchResults closePalette={closePalette} results={results} />
                      )}

                      {!page && (
                        <>
                          <Command.Group heading="Page">
                            <Command.Item
                              onSelect={() => {
                                closePalette();
                                toggleCreatePageModal({ isOpen: true });
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <FileText className="h-3.5 w-3.5" />
                                Create new page
                              </div>
                              <kbd>D</kbd>
                            </Command.Item>
                          </Command.Group>
                          <Command.Group heading="Account">
                            <Command.Item onSelect={createNewWorkspace} className="focus:outline-none">
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <FolderPlus className="h-3.5 w-3.5" />
                                Create new workspace
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Change interface theme...");
                                setSearchTerm("");
                                setPages([...pages, "change-interface-theme"]);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Settings className="h-3.5 w-3.5" />
                                Change interface theme...
                              </div>
                            </Command.Item>
                          </Command.Group>

                          {/* help options */}
                          <CommandPaletteHelpActions closePalette={closePalette} />
                        </>
                      )}

                      {/* theme actions */}
                      {page === "change-interface-theme" && (
                        <CommandPaletteThemeActions
                          closePalette={() => {
                            closePalette();
                            setPages((pages) => pages.slice(0, -1));
                          }}
                        />
                      )}
                    </Command.List>
                  </Command>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
