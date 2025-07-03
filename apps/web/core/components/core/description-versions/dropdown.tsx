import { observer } from "mobx-react";
import { History } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TDescriptionVersion } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { calculateTimeAgo } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// local imports
import { DescriptionVersionsDropdownItem } from "./dropdown-item";
import { TDescriptionVersionEntityInformation } from "./root";

type Props = {
  disabled: boolean;
  entityInformation: TDescriptionVersionEntityInformation;
  onVersionClick: (versionId: string) => void;
  versions: TDescriptionVersion[] | undefined;
};

export const DescriptionVersionsDropdown: React.FC<Props> = observer((props) => {
  const { disabled, entityInformation, onVersionClick, versions } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const latestVersion = versions?.[0];
  const lastUpdatedAt = latestVersion?.created_at ?? entityInformation.createdAt;
  const lastUpdatedByUserDisplayName = latestVersion?.owned_by
    ? getUserDetails(latestVersion?.owned_by)?.display_name
    : entityInformation.createdByDisplayName;
  // translation
  const { t } = useTranslation();

  return (
    <CustomMenu
      label={
        <div className="flex items-center gap-1 text-custom-text-300">
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <History className="size-3.5" />
          </span>
          <p className="text-xs">
            {t("description_versions.last_edited_by")}{" "}
            <span className="font-medium">{lastUpdatedByUserDisplayName ?? t("common.deactivated_user")}</span>{" "}
            {calculateTimeAgo(lastUpdatedAt)}
          </p>
        </div>
      }
      noBorder
      noChevron={disabled}
      placement="bottom-end"
      optionsClassName="w-[300px]"
      disabled={disabled}
      closeOnSelect
    >
      <p className="text-xs text-custom-text-300 font-medium mb-1">{t("description_versions.previously_edited_by")}</p>
      {versions?.map((version) => (
        <DescriptionVersionsDropdownItem key={version.id} onClick={onVersionClick} version={version} />
      ))}
    </CustomMenu>
  );
});
