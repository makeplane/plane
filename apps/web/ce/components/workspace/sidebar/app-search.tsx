import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { SidebarSearchButton } from "@/components/sidebar/search-button";
import { usePowerK } from "@/hooks/store/use-power-k";

export const AppSearch = observer(() => {
  // store hooks
  const { togglePowerKModal } = usePowerK();
  // translation
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => togglePowerKModal(true)}
      aria-label={t("aria_labels.projects_sidebar.open_command_palette")}
    >
      <SidebarSearchButton isActive={false} />
    </button>
  );
});
