/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { ISearchIssueResponse } from "@plane/types";
// services
import { ProjectService } from "@/services/project";

const projectService = new ProjectService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  value: string | null | undefined;
  onChange: (id: string | null) => void;
};

/** Products of the project, to choose the one a meeting is about. */
export function MeetingProductSelect(props: Props) {
  const { workspaceSlug, projectId, value, onChange } = props;
  const { t } = useTranslation();
  const { data } = useSWR(["PROJECT_PRODUCTS", workspaceSlug, projectId], () =>
    projectService.projectIssuesSearch(workspaceSlug, projectId, {
      search: "",
      workspace_search: false,
      kind: "product",
    })
  );
  const options = data ?? [];

  return (
    <Select<ISearchIssueResponse>
      getValues={() => options}
      value={options.find(({ id }) => id === value) ?? null}
      // choosing the product again takes it off
      onChange={(id) => onChange(id === value ? null : String(id))}
      getOptionValue={(product) => product.id}
      getOptionLabel={(product) => product.name}
      placeholder={t("product.kinds.product")}
      emptyMessage={t("product.no_products")}
      pinSelected={false}
    >
      <Select.Trigger<ISearchIssueResponse> variant="pill-md">
        {(selected) => <span className="truncate">{selected[0]?.name ?? t("product.kinds.product")}</span>}
      </Select.Trigger>
    </Select>
  );
}
