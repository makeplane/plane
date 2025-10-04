"use client";

import { useMemo } from "react";
import { Command } from "cmdk";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { getCreateActionsList } from "@/plane-web/components/command-palette/power-k/create-actions";
// local imports
import { PowerKModalCommandItem } from "../modal/command-item";
import type { CommandExecutionContext } from "../types";

type Props = {
  executionContext: CommandExecutionContext;
};

export const PowerKModalCreateActionsMenu: React.FC<Props> = (props) => {
  const { executionContext } = props;
  // store hooks
  const router = useAppRouter();
  // derived values
  const { closePalette } = executionContext;
  const CREATE_OPTIONS_LIST = useMemo(() => getCreateActionsList(router), [router]);

  return (
    <Command.Group heading="Create">
      {CREATE_OPTIONS_LIST.map((option) => {
        if (option.shouldRender !== undefined && option.shouldRender === false) return null;

        return (
          <PowerKModalCommandItem
            key={option.key}
            icon={option.icon}
            label={option.label}
            onSelect={() => {
              option.onClick();
              closePalette();
            }}
            shortcut={option.shortcut}
          />
        );
      })}
    </Command.Group>
  );
};
