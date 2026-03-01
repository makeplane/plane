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

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import type { IProject, IProjectSubscriber, IUserLite, IWorkspace } from "@plane/types";
import { Loader } from "@plane/ui";
// constants
import { PROJECT_DETAILS, PROJECT_SUBSCRIBERS } from "@/constants/fetch-keys";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useFlag } from "@/plane-web/hooks/store";
// services
import projectService from "@/services/project/project.service";
// local imports
import { MemberSelect } from "./member-select";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

type TDefaultSettingItemProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function DefaultSettingItem({ title, description, children }: TDefaultSettingItemProps) {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-13 font-medium">{title}</h4>
        <p className="text-11 text-tertiary">{description}</p>
      </div>
      <div className="w-full max-w-48 sm:max-w-64">{children}</div>
    </div>
  );
}

type TProjectSettingsMemberDefaultsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSettingsMemberDefaults = observer(function ProjectSettingsMemberDefaults(
  props: TProjectSettingsMemberDefaultsProps
) {
  const { workspaceSlug, projectId } = props;
  const [optimisticSubscriberIds, setOptimisticSubscriberIds] = useState<string[] | null>(null);

  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const isProjectSubscribersEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_SUBSCRIBERS);

  const { currentProjectDetails, fetchProjectDetails, updateProject } = useProject();
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    currentProjectDetails?.id
  );

  // form info
  const { reset, control } = useForm<IProject>({ defaultValues });
  // fetching user members
  useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug, projectId) : null
  );

  const { data: subscribers, mutate: mutateSubscribers } = useSWR<IProjectSubscriber[]>(
    workspaceSlug && projectId ? PROJECT_SUBSCRIBERS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => projectService.getProjectSubscribers(workspaceSlug, projectId) : null
  );

  const subscriberIds = useMemo(() => {
    if (!subscribers) return [];
    return subscribers.map((s) => s.subscriber);
  }, [subscribers]);

  const currentSubscriberIds = optimisticSubscriberIds ?? subscriberIds;

  useEffect(() => {
    if (!currentProjectDetails) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails.default_assignee as IUserLite)?.id ?? currentProjectDetails.default_assignee,
      project_lead: (currentProjectDetails.project_lead as IUserLite)?.id ?? currentProjectDetails.project_lead,
      workspace: (currentProjectDetails.workspace as IWorkspace).id,
    });
  }, [currentProjectDetails, reset]);

  const submitChanges = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    reset({
      ...currentProjectDetails,
      default_assignee:
        (currentProjectDetails?.default_assignee as IUserLite)?.id ?? currentProjectDetails?.default_assignee,
      project_lead: (currentProjectDetails?.project_lead as IUserLite)?.id ?? currentProjectDetails?.project_lead,
      ...formData,
    });

    try {
      await updateProject(workspaceSlug, projectId, {
        default_assignee:
          formData.default_assignee === "none"
            ? null
            : (formData.default_assignee ?? currentProjectDetails?.default_assignee),
        project_lead:
          formData.project_lead === "none" ? null : (formData.project_lead ?? currentProjectDetails?.project_lead),
      });
      setToast({
        title: `${t("success")}!`,
        type: TOAST_TYPE.SUCCESS,
        message: t("project_settings.general.toast.success"),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGuestViewAllIssues = async (value: boolean) => {
    if (!workspaceSlug || !projectId) return;

    try {
      await updateProject(workspaceSlug, projectId, {
        guest_view_all_features: value,
      });
      setToast({
        title: `${t("success")}!`,
        type: TOAST_TYPE.SUCCESS,
        message: t("project_settings.general.toast.success"),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribersChange = async (newSubscriberIds: string[]) => {
    if (!workspaceSlug || !projectId || !isAdmin) return;

    setOptimisticSubscriberIds(newSubscriberIds);

    try {
      await projectService.updateProjectSubscribers(workspaceSlug, projectId, newSubscriberIds);

      await mutateSubscribers();
      setOptimisticSubscriberIds(null);

      setToast({
        title: `${t("success")}!`,
        type: TOAST_TYPE.SUCCESS,
        message: t("project_settings.general.toast.success"),
      });
    } catch (err) {
      console.error(err);
      setOptimisticSubscriberIds(null);
      void mutateSubscribers();
      setToast({
        title: t("error"),
        type: TOAST_TYPE.ERROR,
        message: t("common.error.message"),
      });
    }
  };

  return (
    <div className="flex flex-col gap-y-6 my-6">
      <DefaultSettingItem
        title={t("project_settings.members.project_lead")}
        description={t("project_settings.members.project_lead_description")}
      >
        {currentProjectDetails ? (
          <Controller
            control={control}
            name="project_lead"
            render={({ field: { value } }) => (
              <MemberSelect
                value={value}
                onChange={(val: string) => {
                  void submitChanges({ project_lead: val });
                }}
                isDisabled={!isAdmin}
              />
            )}
          />
        ) : (
          <Loader className="h-9 w-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        )}
      </DefaultSettingItem>
      <DefaultSettingItem
        title={t("project_settings.members.default_assignee")}
        description={t("project_settings.members.default_assignee_description")}
      >
        {currentProjectDetails ? (
          <Controller
            control={control}
            name="default_assignee"
            render={({ field: { value } }) => (
              <MemberSelect
                value={value}
                onChange={(val: string) => {
                  void submitChanges({ default_assignee: val });
                }}
                isDisabled={!isAdmin}
              />
            )}
          />
        ) : (
          <Loader className="h-9 w-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        )}
      </DefaultSettingItem>
      {isProjectSubscribersEnabled && (
        <DefaultSettingItem
          title={t("project_settings.members.project_subscribers")}
          description={t("project_settings.members.project_subscribers_description")}
        >
          {currentProjectDetails ? (
            subscribers !== undefined ? (
              <MemberDropdown
                value={currentSubscriberIds}
                onChange={(val) => {
                  void handleSubscribersChange(val);
                }}
                multiple
                projectId={projectId}
                disabled={!isAdmin}
                buttonVariant="border-with-text"
                buttonContainerClassName="w-full"
                buttonClassName="w-full px-3 py-1"
              />
            ) : (
              <Loader className="h-9 w-full">
                <Loader.Item width="100%" height="100%" />
              </Loader>
            )
          ) : (
            <Loader className="h-9 w-full">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </DefaultSettingItem>
      )}
      {currentProjectDetails && (
        <DefaultSettingItem
          title={t("project_settings.members.guest_super_permissions.title")}
          description={t("project_settings.members.guest_super_permissions.sub_heading")}
        >
          <div className="flex items-center justify-end">
            <Switch
              value={!!currentProjectDetails?.guest_view_all_features}
              onChange={() => {
                void toggleGuestViewAllIssues(!currentProjectDetails?.guest_view_all_features);
              }}
              disabled={!isAdmin}
            />
          </div>
        </DefaultSettingItem>
      )}
    </div>
  );
});
