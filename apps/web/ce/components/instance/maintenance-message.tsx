import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";

export const MaintenanceMessage = observer(() => {
  // hooks
  const { t } = useTranslation();

  return (
    <h1 className="text-xl font-medium text-custom-text-100 text-center md:text-left">
      {t(
        "self_hosted_maintenance_message.plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start"
      )}
      <br />
      {t("self_hosted_maintenance_message.choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure")}
    </h1>
  );
});
