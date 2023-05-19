import SettingsNavbar from "layouts/settings-navbar";

export const SettingsHeader = () => (
  <div className="mb-8 space-y-6">
    <div>
      <h3 className="text-2xl font-semibold">Workspace Settings</h3>
      <p className="mt-1 text-sm text-brand-secondary">
        This information will be displayed to every member of the workspace.
      </p>
    </div>
    <SettingsNavbar />
  </div>
);
