/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { MenuItem } from "@makeplane/propel/components/menu";
import { useTranslation } from "@plane/i18n";
import type { TDescriptionVersion } from "@plane/types";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  onClick: (versionId: string) => void;
  version: TDescriptionVersion;
};

export const DescriptionVersionsDropdownItem = observer(function DescriptionVersionsDropdownItem(props: Props) {
  const { onClick, version } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const versionCreator = version.owned_by ? getUserDetails(version.owned_by) : null;
  // translation
  const { t } = useTranslation();

  return (
    <MenuItem
      icon={
        <Avatar
          alt={versionCreator?.display_name ?? t("common.deactivated_user")}
          fallback={(versionCreator?.display_name ?? t("common.deactivated_user"))?.[0]?.toUpperCase()}
          size="2xs"
          src={getFileURL(versionCreator?.avatar_url ?? "")}
        />
      }
      label={versionCreator?.display_name ?? t("common.deactivated_user")}
      secondaryText={calculateTimeAgo(version.last_saved_at)}
      onClick={() => onClick(version.id)}
    />
  );
});
