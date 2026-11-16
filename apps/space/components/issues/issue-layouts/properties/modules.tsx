/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ModuleSelect } from "@plane/blocks/property-select";
import type { SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// helpers
import { READ_ONLY_SELECT_CLASSNAME, toSinglePage } from "@/helpers/select.helper";
// hooks
import { useModule } from "@/hooks/store/use-module";

type Props = {
  moduleIds: string[] | undefined;
  variant?: Exclude<SelectVariant, "breadcrumb">;
  className?: string;
};

/** The work item modules as a read-only `ModuleSelect` chip. */
export const IssueBlockModules = observer(function IssueBlockModules(props: Props) {
  const { moduleIds, variant = "pill-md", className } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { modules, getModulesByIds } = useModule();
  // derived values
  const selectedModules = getModulesByIds(moduleIds ?? []).map(({ id, name }) => ({ id, name }));

  return (
    <ModuleSelect
      multiple
      getValues={() => toSinglePage(modules?.map(({ id, name }) => ({ id, name })))}
      value={selectedModules}
      onChange={() => {}}
      variant={variant}
      placeholder={t("common.modules")}
      className={cn(READ_ONLY_SELECT_CLASSNAME, className)}
      tooltip={{ heading: t("common.modules"), emptyContent: t("common.none") }}
      disabled
    />
  );
});
