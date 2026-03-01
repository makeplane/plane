/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
// plane imports
import { EProductSubscriptionTier, EUserPermissionsLevel, LOGIN_MEDIUM_LABELS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import { AccountTypeColumn, NameColumn } from "@/components/workspace/settings/member-columns";
import type { RowData } from "@/components/workspace/settings/member-columns";
import { MemberHeaderColumn } from "@/components/projects/common/column-header";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useUser } from "@/hooks/store/user/user-user";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// store
import type { IMemberFilters } from "@/store/member/utils";

type TUseWorkspaceMembersColumnsProps = {
  workspaceSlug: string;
};

export const useWorkspaceMembersColumns = (props: TUseWorkspaceMembersColumnsProps) => {
  const { workspaceSlug } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const {
    workspace: {
      filtersStore: { filters, updateFilters },
    },
  } = useMember();
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const showBillingStatusColumn =
    currentWorkspaceSubscribedPlanDetail &&
    EProductSubscriptionTier[currentWorkspaceSubscribedPlanDetail.product] >= EProductSubscriptionTier.PRO;

  const isSuspended = (rowData: RowData) => rowData.is_active === false;

  // handlers
  const handleDisplayFilterUpdate = (filterUpdates: Partial<IMemberFilters>) => {
    updateFilters(filterUpdates);
  };

  const columns = [
    {
      key: "Full name",
      content: t("workspace_settings.settings.members.details.full_name"),
      thClassName: "text-left",
      thRender: () => (
        <MemberHeaderColumn
          property="full_name"
          displayFilters={filters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => (
        <NameColumn
          rowData={rowData}
          workspaceSlug={workspaceSlug}
          isAdmin={isAdmin}
          currentUser={currentUser}
          setRemoveMemberModal={setRemoveMemberModal}
        />
      ),
    },
    {
      key: "Display name",
      content: t("workspace_settings.settings.members.details.display_name"),
      tdRender: (rowData: RowData) => (
        <div className={`w-32 ${isSuspended(rowData) ? "text-placeholder" : ""}`}>{rowData.member.display_name}</div>
      ),
      thRender: () => (
        <MemberHeaderColumn
          property="display_name"
          displayFilters={filters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
    },
    {
      key: "Email address",
      content: t("workspace_settings.settings.members.details.email_address"),
      tdRender: (rowData: RowData) => (
        <div className={`w-48 truncate ${isSuspended(rowData) ? "text-placeholder" : ""}`}>{rowData.member.email}</div>
      ),
      thRender: () => (
        <MemberHeaderColumn
          property="email"
          displayFilters={filters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
    },
    {
      key: "Account type",
      content: t("workspace_settings.settings.members.details.account_type"),
      thRender: () => (
        <MemberHeaderColumn
          property="role"
          displayFilters={filters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => <AccountTypeColumn rowData={rowData} workspaceSlug={workspaceSlug} />,
    },
    ...(showBillingStatusColumn
      ? [
          {
            key: "Billing Status",
            content: "Billing Status",
            tdRender: (rowData: RowData) => <div className="w-36">{rowData.is_active ? "Active" : "-"}</div>,
          },
        ]
      : []),
    {
      key: "Authentication",
      content: t("workspace_settings.settings.members.details.authentication"),
      tdRender: (rowData: RowData) => {
        if (isSuspended(rowData)) return null;
        const loginMedium = rowData.member.last_login_medium;
        if (!loginMedium) return null;
        return <div>{LOGIN_MEDIUM_LABELS[loginMedium]}</div>;
      },
    },
    {
      key: "Joining date",
      content: t("workspace_settings.settings.members.details.joining_date"),
      tdRender: (rowData: RowData) =>
        isSuspended(rowData) ? null : <div>{renderFormattedDate(rowData?.member?.joining_date)}</div>,
      thRender: () => (
        <MemberHeaderColumn
          property="joining_date"
          displayFilters={filters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
    },
  ];

  return {
    columns,
    workspaceSlug,
    removeMemberModal,
    setRemoveMemberModal,
  };
};
