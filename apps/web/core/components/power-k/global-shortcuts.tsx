"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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
export const GlobalShortcutsProvider = observer((props: GlobalShortcutsProps) => {
  const { context } = props;
  // router
  const router = useAppRouter();
  const params = useParams();
  // store hooks
  const { getCommandRegistry, isShortcutModalOpen, setActiveContext, toggleCommandPaletteModal, toggleShortcutModal } =
    useCommandPalette();
  // derived values
  const commands = usePowerKCommands(context);

  // Detect context from URL and update store
  useEffect(() => {
    const detected = detectContextFromURL(params);
    setActiveContext(detected);
  }, [params, setActiveContext]);

  // Register commands on mount
  useEffect(() => {
    const registry = getCommandRegistry();
    registry.clear();
    registry.registerMultiple(commands);
  }, [getCommandRegistry, context, commands]);

  // Setup global shortcut handler
  useEffect(() => {
    const registry = getCommandRegistry();

    const handler = new ShortcutHandler(
      registry,
      () => context,
      () => toggleCommandPaletteModal(true)
    );

    document.addEventListener("keydown", handler.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handler.handleKeyDown);
      handler.destroy();
    };
  }, [context, router, getCommandRegistry, toggleCommandPaletteModal]);

  return <ShortcutsModal isOpen={isShortcutModalOpen} onClose={() => toggleShortcutModal(false)} />;
});
