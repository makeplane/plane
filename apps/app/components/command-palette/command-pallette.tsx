import React, { useState, useCallback, useEffect } from "react";

import { useRouter } from "next/router";

// cmdk
import { Command } from "cmdk";
// hooks
import useTheme from "hooks/use-theme";
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import { ShortcutsModal } from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CreateProjectModal } from "components/project";
import { CreateUpdateIssueModal } from "components/issues";
import { CreateUpdateCycleModal } from "components/cycles";
import { CreateUpdateModuleModal } from "components/modules";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";

export const CommandPalette: React.FC = () => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isBulkDeleteIssuesModalOpen, setIsBulkDeleteIssuesModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();
  const { toggleCollapsed } = useTheme();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target as Element).classList?.contains("remirror-editor")
      ) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setIsPaletteOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          if (e.altKey) {
            e.preventDefault();
            if (!router.query.issueId) return;

            const url = new URL(window.location.href);
            copyTextToClipboard(url.href)
              .then(() => {
                setToastAlert({
                  type: "success",
                  title: "Copied to clipboard",
                });
              })
              .catch(() => {
                setToastAlert({
                  type: "error",
                  title: "Some error occurred",
                });
              });
          }
        } else if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          setIsIssueModalOpen(true);
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          setIsProjectModalOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
          e.preventDefault();
          toggleCollapsed();
        } else if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
        } else if (e.key.toLowerCase() === "q") {
          e.preventDefault();
          setIsCreateCycleModalOpen(true);
        } else if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          setIsCreateModuleModalOpen(true);
        } else if (e.key === "Delete") {
          e.preventDefault();
          setIsBulkDeleteIssuesModalOpen(true);
        }
      }
    },
    [toggleCollapsed, setToastAlert, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;

  return (
    <>
      <ShortcutsModal isOpen={isShortcutsModalOpen} setIsOpen={setIsShortcutsModalOpen} />
      {workspaceSlug && (
        <CreateProjectModal isOpen={isProjectModalOpen} setIsOpen={setIsProjectModalOpen} />
      )}
      {projectId && (
        <>
          <CreateUpdateCycleModal
            isOpen={isCreateCycleModalOpen}
            handleClose={() => setIsCreateCycleModalOpen(false)}
          />
          <CreateUpdateModuleModal
            isOpen={isCreateModuleModalOpen}
            setIsOpen={setIsCreateModuleModalOpen}
          />
        </>
      )}
      <CreateUpdateIssueModal
        isOpen={isIssueModalOpen}
        handleClose={() => setIsIssueModalOpen(false)}
      />
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssuesModalOpen}
        setIsOpen={setIsBulkDeleteIssuesModalOpen}
      />
      <div
        className={`fixed top-0 left-0 z-20 h-full w-full ${isPaletteOpen ? "block" : "hidden"}`}
      >
        <div className="relative">
          <Command.Dialog
            open={isPaletteOpen}
            onOpenChange={setIsPaletteOpen}
            label="Global Command Menu"
            className="absolute top-20 left-1/2 z-20 h-1/2 w-1/2 -translate-x-1/2 rounded-lg border bg-white shadow"
          >
            <Command.Input
              className="w-full rounded-t-lg border-b px-2 py-3 text-sm outline-none"
              placeholder="Type a command or search..."
            />
            <Command.List className="p-2">
              <Command.Empty className="mt-4 text-center text-gray-500">
                No results found.
              </Command.Empty>

              <Command.Group heading="Create">
                <Command.Item>Create new workspace</Command.Item>
                <Command.Item>
                  Create new project
                  <kbd>P</kbd>
                </Command.Item>
                <Command.Item>
                  Create new issue
                  <kbd>C</kbd>
                </Command.Item>
                <Command.Item>
                  Create new module
                  <kbd>M</kbd>
                </Command.Item>
                <Command.Item>
                  Create new cycle
                  <kbd>Q</kbd>
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Letters">
                <Command.Item>a</Command.Item>
                <Command.Item>b</Command.Item>
                <Command.Separator />
                <Command.Item>c</Command.Item>
              </Command.Group>
            </Command.List>
          </Command.Dialog>
        </div>
      </div>
    </>
  );
};
