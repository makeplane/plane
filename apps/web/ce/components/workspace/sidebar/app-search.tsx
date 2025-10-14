import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { SidebarSearchButton } from "@/components/sidebar/search-button";

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
