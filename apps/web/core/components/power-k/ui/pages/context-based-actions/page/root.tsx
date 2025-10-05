"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { PowerKModalCommandItem } from "../../../modal/command-item";
import type { TPowerKPageKeys } from "../../../types";
import { getPowerKPageContextBasedActions } from "../page/actions";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKPageActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { pageId } = useParams();
  // store hooks
  const { getPageById } = usePageStore(EPageStoreType.PROJECT);
  // derived values
  const page = pageId ? getPageById(pageId.toString()) : null;
  // translation
  const { t } = useTranslation();

  const ACTIONS_LIST = getPowerKPageContextBasedActions({
    handleClose,
    handleUpdatePage,
    handleUpdateSearchTerm,
    page,
  });

  if (!page) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading={t("power_k.contextual_actions.page.title")}>
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
