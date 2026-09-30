/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { useWorkspaceIssueTypes } from "@/plane-web/hooks/use-workspace-issue-types";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedIssueTypeFilters = observer(function AppliedIssueTypeFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  const { workspaceSlug } = useParams();
  const { typeMap } = useWorkspaceIssueTypes(workspaceSlug?.toString());

  return (
    <>
      {values.map((typeId) => {
        const typeDetails = typeMap[typeId];
        if (!typeDetails) return null;
        return (
          <div key={typeId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <SwitcherIcon logo_props={typeDetails.logo_props} LabelIcon={Layers} size={10} />
            <span className="normal-case">{typeDetails.name}</span>
            {editable ? (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(typeId)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        );
      })}
    </>
  );
});
