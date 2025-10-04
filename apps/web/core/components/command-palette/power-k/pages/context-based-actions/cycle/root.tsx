"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// local imports
import type { TPowerKPageKeys } from "../../../types";
import { PowerKModalCommandItem } from "../../../modal/command-item";
import { getPowerKCycleContextBasedActions } from "./actions";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKCycleActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { cycleId } = useParams();
  // store hooks
  const { getCycleById } = useCycle();
  // derived values
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : null;
  // translation
  const { t } = useTranslation();

  const ACTIONS_LIST = getPowerKCycleContextBasedActions({
    handleClose,
    handleUpdatePage,
    handleUpdateSearchTerm,
  });

  if (!cycleDetails) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading={t("power_k.contextual_actions.cycle.title")}>
          {ACTIONS_LIST.map((action) => {
            if (action.shouldRender === false) return null;

            return (
              <PowerKModalCommandItem
                key={action.key}
                icon={action.icon}
                label={t(action.i18n_label)}
                onSelect={action.action}
              />
            );
          })}
        </Command.Group>
      )}
    </>
  );
});
