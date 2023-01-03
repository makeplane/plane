// hooks
import useUser from "lib/hooks/useUser";
// layouts
import SettingsLayout from "layouts/settings-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "ui";

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
          </div>
          <div className="space-y-8 md:w-2/3">
            <div className="flex items-center gap-x-10 gap-y-2">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Use modules</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Modules are enabled for all the projects in this workspace. Access it from the
                  navigation bar.
                </p>
              </div>
              <div>
                {/* Disabled- bg-gray-200, translate-x-0 */}
                <button
                  type="button"
                  className="pointer-events-none relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-500 transition-colors duration-200 ease-in-out focus:outline-none"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-x-10 gap-y-2">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Use cycles</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Cycles are enabled for all the projects in this workspace. Access it from the
                  navigation bar.
                </p>
              </div>
              <div>
                {/* Disabled- bg-gray-200, translate-x-0 */}
                <button
                  type="button"
                  className="pointer-events-none relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-500 transition-colors duration-200 ease-in-out focus:outline-none"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-x-10 gap-y-2">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Use backlogs</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Backlog are enabled for all the projects in this workspace. Access it from the
                  navigation bar.
                </p>
              </div>
              <div>
                {/* Disabled- bg-gray-200, translate-x-0 */}
                <button
                  type="button"
                  className="pointer-events-none relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-500 transition-colors duration-200 ease-in-out focus:outline-none"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </SettingsLayout>
    </>
  );
};

export default BillingSettings;
