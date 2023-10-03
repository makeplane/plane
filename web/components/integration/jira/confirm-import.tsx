import React from "react";

// react hook form
import { useFormContext } from "react-hook-form";

// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

// types
import { IJiraImporterForm } from "types";

export const JiraConfirmImport: React.FC = () => {
  const store: RootStore = useMobxStore();
  const { watch } = useFormContext<IJiraImporterForm>();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-2">
          <h3 className="text-lg font-semibold">{store.locale.localized("Confirm")}</h3>
        </div>

        <div className="col-span-1">
          <p className="text-sm text-custom-text-200">{store.locale.localized("Migrating")}</p>
        </div>
        <div className="col-span-1 flex items-center justify-between">
          <div>
            <h4 className="mb-2 text-lg font-semibold">{watch("data.total_issues")}</h4>
            <p className="text-sm text-custom-text-200">{store.locale.localized("Issues")}</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{watch("data.total_states")}</h4>
            <p className="text-sm text-custom-text-200">{store.locale.localized("States")}</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{watch("data.total_modules")}</h4>
            <p className="text-sm text-custom-text-200">{store.locale.localized("Modules")}</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{watch("data.total_labels")}</h4>
            <p className="text-sm text-custom-text-200">{store.locale.localized("Labels")}</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">
              {watch("data.users").filter((user) => user.import).length}
            </h4>
            <p className="text-sm text-custom-text-200">{store.locale.localized("User")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
