"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Briefcase } from "lucide-react";
// components
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@/components/common/logo";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TProjectMap } from "@/plane-web/types/integrations";
// public images
import GitlabLogo from "@/public/services/gitlab.svg";

type TEntityForm = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
};

export const EntityForm: FC<TEntityForm> = observer((props) => {
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
    <div className="relative space-y-4 text-sm">
      <div className="space-y-1">
        <div className="text-custom-text-200">Gitlab {t("common.project")}</div>
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
              <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      </div>
    </div>
  );
});
