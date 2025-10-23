"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { detectContextFromURL } from "./core/context-detector";
import { ShortcutHandler } from "./core/shortcut-handler";
import type { TPowerKCommandConfig, TPowerKContext } from "./core/types";
import { ShortcutsModal } from "./ui/modal/shortcuts-root";

type GlobalShortcutsProps = {
  context: TPowerKContext;
  commands: TPowerKCommandConfig[];
};

/**
 * Global shortcuts component - sets up keyboard listeners and context detection
 * Should be mounted once at the app root level
 */
export const GlobalShortcutsProvider = observer((props: GlobalShortcutsProps) => {
  const { context, commands } = props;
  // router
  const router = useAppRouter();
  const params = useParams();
  // store hooks
  const { commandRegistry, isShortcutsListModalOpen, setActiveContext, togglePowerKModal, toggleShortcutsListModal } =
    usePowerK();

  // Detect context from URL and update store
  useEffect(() => {
    const detected = detectContextFromURL(params);
    setActiveContext(detected);
  }, [params, setActiveContext]);

  // Register commands on mount
  useEffect(() => {
    commandRegistry.clear();
    commandRegistry.registerMultiple(commands);
  }, [commandRegistry, commands]);

  // Setup global shortcut handler
  useEffect(() => {
    const handler = new ShortcutHandler(
      commandRegistry,
      () => context,
      () => togglePowerKModal(true)
    );

    document.addEventListener("keydown", handler.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handler.handleKeyDown);
      handler.destroy();
    };
  }, [context, router, commandRegistry, togglePowerKModal]);

  return <ShortcutsModal isOpen={isShortcutsListModalOpen} onClose={() => toggleShortcutsListModal(false)} />;
});
