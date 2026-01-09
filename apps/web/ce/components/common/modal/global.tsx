import { lazy, Suspense } from "react";
import { observer } from "mobx-react";

const ProfileSettingsModal = lazy(() =>
  import("@/components/settings/profile/modal").then((module) => ({
    default: module.ProfileSettingsModal,
  }))
);

type TGlobalModalsProps = {
  workspaceSlug: string;
};

/**
 * GlobalModals component manages all workspace-level modals across Plane applications.
 *
 * This includes:
 * - Profile settings modal
 */
export const GlobalModals = observer(function GlobalModals(_props: TGlobalModalsProps) {
  return (
    <Suspense fallback={null}>
      <ProfileSettingsModal />
    </Suspense>
  );
});
