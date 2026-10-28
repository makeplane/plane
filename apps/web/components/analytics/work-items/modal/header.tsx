/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane package imports
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ArrowCollapseOutline, CloseOutline, FullScreenOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { ICycle, IModule } from "@plane/types";
// icons

type Props = {
  fullScreen: boolean;
  handleClose: () => void;
  setFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cycle?: ICycle;
  module?: IModule;
};

export const WorkItemsModalHeader = observer(function WorkItemsModalHeader(props: Props) {
  const { fullScreen, handleClose, setFullScreen, title, cycle, module } = props;
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4 bg-surface-1 px-5 py-4 text-body-xs-regular">
      <h3 className="text-body-md-semibold break-words">
        Analytics for {title} {cycle && `in ${cycle.name}`} {module && `in ${module.name}`}
      </h3>
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <IconButton
            type="button"
            variant="ghost"
            size="md"
            aria-label={t("common.full_screen")}
            aria-pressed={fullScreen}
            onClick={() => setFullScreen((prevData) => !prevData)}
            icon={
              fullScreen ? (
                <ArrowCollapseOutline width={14} height={14} />
              ) : (
                <FullScreenOutline width={14} height={14} />
              )
            }
          />
        </div>
        <IconButton
          type="button"
          variant="ghost"
          size="md"
          aria-label={t("close")}
          onClick={handleClose}
          icon={<CloseOutline height={14} width={14} />}
        />
      </div>
    </div>
  );
});
