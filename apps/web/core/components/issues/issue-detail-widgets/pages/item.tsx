/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon, TrashIcon } from "@plane/propel/icons";
import type { TIssueServiceType } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { getPageName } from "@plane/utils";
// hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { TPageOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  pageOperations: TPageOperations;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePageItem = observer(function IssuePageItem(props: Props) {
  const { workspaceSlug, projectId, pageId, pageOperations, disabled, issueServiceType } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const {
    issuePage: { getIssuePageById },
  } = useIssueDetail(issueServiceType);
  const pageInstance = usePageStore(EPageStoreType.PROJECT).getPageById(pageId);
  // derived values
  const pageSnapshot = getIssuePageById(pageId);
  if (!pageInstance && !pageSnapshot) return null;

  const pageName = getPageName(pageInstance?.name ?? pageSnapshot?.name);
  const logoProps = pageInstance?.logo_props ?? pageSnapshot?.logo_props;
  const redirectionLink =
    pageInstance?.getRedirectionLink() ??
    `/${workspaceSlug}/projects/${pageSnapshot?.project_ids?.[0] ?? projectId}/pages/${pageId}`;

  return (
    <div className="group 3xl:col-span-2 col-span-12 flex h-10 flex-shrink-0 items-center justify-between gap-3 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-3 hover:bg-layer-1 lg:col-span-6 xl:col-span-4 2xl:col-span-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex size-4 flex-shrink-0 items-center justify-center">
          {logoProps?.in_use ? (
            <Logo logo={logoProps} size={16} type="lucide" />
          ) : (
            <PageIcon className="size-4 flex-shrink-0 text-tertiary group-hover:text-primary" />
          )}
        </span>
        <Link href={redirectionLink} className="flex w-0 flex-1 cursor-pointer items-center text-body-xs-regular">
          <span className="w-0 flex-1 truncate">{pageName}</span>
        </Link>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <CustomMenu
          ariaLabel={t("aria_labels.quick_actions.page")}
          ellipsis
          buttonClassName="text-placeholder group-hover:text-secondary"
          placement="bottom-end"
          closeOnSelect
          disabled={disabled}
        >
          <CustomMenu.MenuItem
            className="flex items-center gap-2"
            onClick={() => {
              pageOperations.detach(pageId);
            }}
          >
            <TrashIcon className="h-3 w-3" />
            {t("common.actions.delete")}
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
});
