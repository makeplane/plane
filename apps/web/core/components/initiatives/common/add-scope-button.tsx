/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { BriefcaseIcon } from "lucide-react";
import { PlusIcon, EpicIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomMenu } from "@plane/ui";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const AddScopeButton = observer(function AddScopeButton(props: Props) {
  const { customButton, disabled } = props;
  // store hooks
  const {
    initiative: { toggleProjectsModal, toggleEpicModal },
  } = useInitiatives();
  const { t } = useTranslation();

  // options
  const optionItems = [
    {
      i18n_label: "common.epics",
      icon: <EpicIcon className="h-3 w-3" />,
      onClick: () => toggleEpicModal(true),
    },
    {
      i18n_label: "common.projects",
      icon: <BriefcaseIcon className="h-3 w-3" />,
      onClick: () => toggleProjectsModal(true),
    },
  ];

  const customButtonElement = customButton ? (
    <>{customButton}</>
  ) : (
    <Button variant="secondary" size="lg" prependIcon={<PlusIcon />}>
      {t("initiatives.scope.add_scope")}
    </Button>
  );

  return (
    <>
      <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
        {optionItems.map((item, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={() => {
              item.onClick();
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{t(item.i18n_label)}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
