import { useMemo } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane ui
import { useEventTracker, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web helpers
import { getCreateActionsList } from "@/plane-web/components/command-palette/power-k";
// local components
import { PowerKCommandItem } from "./command-item";

type Props = {
  handleClose: () => void;
};

export const PowerKCreateActionsMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const router = useAppRouter();
  // store hooks
  const { canPerformAnyCreateAction } = useUser();
  const { setTrackElement } = useEventTracker();
  // derived values
  const CREATE_OPTIONS_LIST = useMemo(() => getCreateActionsList(router), [router]);

  return (
    <>
      {canPerformAnyCreateAction && (
        <Command.Group heading="Create">
          {CREATE_OPTIONS_LIST.map((option) => {
            if (option.shouldRender !== undefined && option.shouldRender === false) return null;

            return (
              <PowerKCommandItem
                key={option.key}
                icon={option.icon}
                label={option.label}
                onSelect={() => {
                  setTrackElement("Power K");
                  option.onClick();
                  handleClose();
                }}
                shortcut={option.shortcut}
              />
            );
          })}
        </Command.Group>
      )}
    </>
  );
});
