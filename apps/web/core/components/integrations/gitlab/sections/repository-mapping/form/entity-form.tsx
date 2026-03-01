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

import type { FC } from "react";
import { observer } from "mobx-react";
// components
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
// assets
import GitlabLogo from "@/app/assets/services/gitlab.svg?url";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";

type TEntityForm = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
};

export const EntityForm = observer(function EntityForm(props: TEntityForm) {
  // props
  const { value, handleChange, isEnterprise } = props;
  // hooks
  const {
    data: { gitlabEntityIds, gitlabEntityById },
    entityConnection: { entityConnectionIds, entityConnectionById },
  } = useGitlabIntegration(isEnterprise);
  const { t } = useTranslation();

  // existing connections
  const entityConnections = entityConnectionIds.map((id) => {
    const entityConnection = entityConnectionById(id);
    if (!entityConnection || entityConnection.type !== EConnectionType.ENTITY) {
      return;
    }
    return entityConnection;
  });

  const connectedEntities = entityConnections.map((entityConnection) => entityConnection?.entity_id);

  // derived values
  const entities = (gitlabEntityIds || [])
    .map((id) => {
      const entity = gitlabEntityById(id);
      return entity || undefined;
    })
    .filter((entity) => entity !== undefined && entity !== null && !connectedEntities.includes(entity.id?.toString()));

  return (
    <div className="relative space-y-4 text-body-xs-regular">
      <div className="space-y-1">
        <div className="text-secondary">Gitlab {t("common.project")}</div>
        <Dropdown
          dropdownOptions={(entities || [])?.map((entity) => ({
            key: entity?.id.toString() || "",
            label: entity?.name || "",
            value: entity?.id.toString() || "",
            data: entity,
          }))}
          value={value?.entityId || undefined}
          placeHolder={t("gitlab_integration.choose_entity")}
          onChange={(value: string | undefined) => handleChange("entityId", value || undefined)}
          iconExtractor={() => (
            <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              <img src={GitlabLogo} alt="Gitlab Logo" className="w-full h-full object-cover" />
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      </div>
    </div>
  );
});
