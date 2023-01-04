// hooks
import useUser from "lib/hooks/useUser";
// layouts
import SettingsLayout from "layouts/settings-layout";
// ui
import { BreadcrumbItem, Breadcrumbs, Button } from "ui";

const BillingSettings = () => {
  const { activeWorkspace } = useUser();

  return (
    <>
      <SettingsLayout
        type="workspace"
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"}`} link={`/workspace`} />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Billing & Plans</h3>
            <p className="mt-4 text-sm text-gray-500">[Free launch preview] plan Pro</p>
          </div>
          <div className="space-y-8 md:w-2/3">
            <div>
              <div className="w-80 rounded-md border bg-white p-4 text-center">
                <h4 className="text-md mb-1 leading-6 text-gray-900">Payment due</h4>
                <h2 className="text-3xl font-extrabold">--</h2>
              </div>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6 text-gray-900">Current plan</h4>
              <p className="mb-3 text-sm text-gray-500">You are currently using the free plan</p>
              <Button theme="secondary" size="rg" className="text-xs">
                View Plans and Upgrade
              </Button>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6 text-gray-900">Billing history</h4>
              <p className="mb-3 text-sm text-gray-500">There are no invoices to display</p>
            </div>
          </div>
        </section>
      </SettingsLayout>
    </>
  );
};

export default BillingSettings;
