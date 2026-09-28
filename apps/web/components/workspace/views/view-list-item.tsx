/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { DeleteOutline, EditOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { truncateText } from "@plane/utils";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
// local imports
import { DeleteGlobalViewModal } from "./delete-view-modal";
import { CreateUpdateWorkspaceViewModal } from "./modal";

type Props = { viewId: string };

export const GlobalViewListItem = observer(function GlobalViewListItem(props: Props) {
  const { viewId } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getViewDetailsById } = useGlobalView();
  // derived data
  const view = getViewDetailsById(viewId);

  if (!view) return null;

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <div className="group border-b border-subtle hover:bg-surface-2">
        <Link href={`/${workspaceSlug}/workspace-views/${view.id}`}>
          <div className="relative flex h-[52px] w-full items-center justify-between rounded-sm p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="truncate text-13 leading-4 font-medium">{truncateText(view.name, 75)}</p>
                  {view?.description && <p className="text-11 text-secondary">{view.description}</p>}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-4">
                  <Menu>
                    <MenuTrigger
                      render={
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label={t("aria_labels.common.more_actions")}
                          icon={<Icon icon={MoreHorizontalOutline} />}
                          // the row is a link: keep the trigger from navigating
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
                          }}
                        />
                      }
                    />
                    {/* React events bubble through the portal to the row link, so the whole popup stops them. */}
                    <MenuContent
                      side="bottom"
                      align="end"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MenuItem
                        icon={<Icon icon={EditOutline} />}
                        label="Edit View"
                        onClick={() => setUpdateViewModal(true)}
                      />
                      <MenuItem
                        icon={<Icon icon={DeleteOutline} />}
                        label="Delete View"
                        onClick={() => setDeleteViewModal(true)}
                      />
                    </MenuContent>
                  </Menu>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
});
