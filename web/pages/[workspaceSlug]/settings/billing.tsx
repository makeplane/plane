import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// component
import { WorkspaceSettingHeader } from "components/headers";
// ui
import { Button } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const BillingSettingsPage: NextPageWithLayout = observer(() => {
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <section className="w-full overflow-y-auto py-8 pr-9">
      <div>
        <div className="flex  items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Billing & Plans</h3>
        </div>
      </div>
      <div className="px-4 py-6">
        <div>
          <h4 className="text-md mb-1 leading-6">Current plan</h4>
          <p className="mb-3 text-sm text-custom-text-200">You are currently using the free plan</p>
          <a href="https://plane.so/pricing" target="_blank" rel="noreferrer">
            <Button variant="neutral-primary">View Plans</Button>
          </a>
        </div>
      </div>
    </section>
  );
});

BillingSettingsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Billing & Plans Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default BillingSettingsPage;
