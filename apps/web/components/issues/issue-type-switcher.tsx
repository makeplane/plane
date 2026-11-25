/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Pill } from "@makeplane/propel/elements/pill";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { ConvertToMeetingDialog } from "@/components/meetings/convert-dialog";
import { ConvertToProductDialog } from "@/components/products/convert-dialog";
import { useProductUpdate } from "@/components/products/use-product";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTeam } from "@/hooks/store/use-team";

export type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  // states
  const [dialog, setDialog] = useState<"product" | "meeting" | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { isEnabled } = useTeam();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const slug = workspaceSlug?.toString() ?? "";
  const update = useProductUpdate(slug, issue?.project_id ?? "", issueId);

  if (!issue || !issue.project_id) return <></>;

  const kind = issue.kind ?? "task";

  return (
    <>
      <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />
      {isEnabled && !disabled && (
        <>
          <Menu>
            <MenuTrigger
              render={
                <Pill size="sm" variant="outline" aria-label={t("product.kind")}>
                  {t(`product.kinds.${kind}`)}
                </Pill>
              }
            />
            <MenuContent side="bottom" align="start">
              {kind === "task" ? (
                <>
                  <MenuItem label={t("product.make_product")} onClick={() => setDialog("product")} />
                  <MenuItem label={t("meeting.make_meeting")} onClick={() => setDialog("meeting")} />
                </>
              ) : (
                <MenuItem label={t("product.make_task")} onClick={() => void update({ kind: "task" })} />
              )}
            </MenuContent>
          </Menu>
          <ConvertToProductDialog
            isOpen={dialog === "product"}
            workspaceSlug={slug}
            issue={issue}
            onClose={() => setDialog(null)}
            onSubmit={update}
          />
          <ConvertToMeetingDialog isOpen={dialog === "meeting"} onClose={() => setDialog(null)} onSubmit={update} />
        </>
      )}
    </>
  );
});
