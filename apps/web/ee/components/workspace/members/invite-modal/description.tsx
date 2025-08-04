import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TMemberInviteCheck } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TInvitationDescriptionProps = {
  data: TMemberInviteCheck | undefined | null;
  isLoading: boolean;
};

export const InvitationDescription = observer((props: TInvitationDescriptionProps) => {
  const { data, isLoading } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isSeatManagementEnabled } = useWorkspaceSubscription();

  return (
    <>
      {isSeatManagementEnabled ? (
        <>
          {isLoading ? (
            <Loader className="w-full h-10">
              <Loader.Item height="100%" width="100%" />
            </Loader>
          ) : (
            <p className="text-sm text-custom-text-200">
              You can add <b>{data?.allowed_admin_members}</b> more users as{" "}
              <span className="text-custom-text-100 font-medium">Admins or Members</span> and{" "}
              <b>{data?.allowed_guests}</b> more users as{" "}
              <span className="text-custom-text-100 font-medium">Guests</span> to this workspace.
            </p>
          )}
        </>
      ) : (
        t("workspace_settings.settings.members.modal.description")
      )}
    </>
  );
});
