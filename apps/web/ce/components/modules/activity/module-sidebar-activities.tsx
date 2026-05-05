/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ModuleActivityList } from "./module-activity-list";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

export const ModuleSidebarActivities = ({ workspaceSlug, projectId, moduleId }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-subtle px-1.5 py-5">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div className={`relative flex h-full w-full flex-col ${open ? "" : "flex-row"}`}>
            <Disclosure.Button className="flex w-full items-center justify-between gap-2 p-1.5">
              <div className="flex items-center justify-start gap-2 text-13">
                <span className="font-medium text-secondary">{t("module.activity.title")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ChevronDownIcon className={`h-3.5 w-3.5 ${open ? "rotate-180 transform" : ""}`} aria-hidden="true" />
              </div>
            </Disclosure.Button>
            <Transition show={open}>
              <Disclosure.Panel>
                <div className="mt-2 w-full overflow-y-auto">
                  <ModuleActivityList workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} />
                </div>
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>
    </div>
  );
};
