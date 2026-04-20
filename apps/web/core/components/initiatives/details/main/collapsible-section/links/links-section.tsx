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
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/components/common/layout/main/sections/collapsible-root";
// local imports
import { InitiativeLinksActionButton } from "../../info-section/link-button";
import { InitiativeLinksCollapsibleContent } from "./link-components/content";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  permissions: {
    canCreate: boolean;
    canEdit: (linkId: string) => boolean;
    canDelete: (linkId: string) => boolean;
  };
};

export const LinksSection = observer(function LinksSection(props: Props) {
  const { workspaceSlug, initiativeId, isOpen, onToggle, count, permissions } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleDetailSection
      title={t("common.links")}
      actionItemElement={
        permissions.canCreate && <InitiativeLinksActionButton variant="layer-1" canAddLink={permissions.canCreate} />
      }
      count={count}
      collapsibleContent={
        <InitiativeLinksCollapsibleContent
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          permissions={permissions}
        />
      }
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
});
