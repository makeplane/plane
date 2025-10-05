"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { ShortcutsModal } from "../command-palette/shortcuts-modal/modal";
import { usePowerKCommands } from "./config/commands";
import { detectContextFromURL } from "./core/context-detector";
import { ShortcutHandler } from "./core/shortcut-handler";
import type { TPowerKContext } from "./core/types";

type GlobalShortcutsProps = {
  context: TPowerKContext;
};

/**
 * Global shortcuts component - sets up keyboard listeners and context detection
 * Should be mounted once at the app root level
 */
export const GlobalShortcuts = observer((props: GlobalShortcutsProps) => {
  const { context } = props;
  // router
  const pathname = usePathname();
  const router = useAppRouter();
  const params = useParams();
  const commandPaletteStore = useCommandPalette();
  const commands = usePowerKCommands(context);

  // Detect context from URL and update store
  useEffect(() => {
    const detected = detectContextFromURL(params, pathname);
    commandPaletteStore.setActiveContext(detected);
  }, [params, pathname, commandPaletteStore]);

  // Register commands on mount
  useEffect(() => {
    const registry = commandPaletteStore.getCommandRegistry();
    registry.clear();
    registry.registerMultiple(commands);
  }, [commandPaletteStore, commands]);

  // Setup global shortcut handler
  useEffect(() => {
    const registry = commandPaletteStore.getCommandRegistry();

    const handler = new ShortcutHandler(
      registry,
      () => context,
      () => commandPaletteStore.toggleCommandPaletteModal(true)
    );

    document.addEventListener("keydown", handler.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handler.handleKeyDown);
      handler.destroy();
    };
  }, [context, router, commandPaletteStore]);

  return (
    <ShortcutsModal
      isOpen={commandPaletteStore.isShortcutModalOpen}
      onClose={() => commandPaletteStore.toggleShortcutModal(false)}
    />
  );
});
