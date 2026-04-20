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
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ReleaseTag, ReleaseTagWrite } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// services
import releaseService from "@/services/release.service";
// local
import { DeleteReleaseTagModal } from "./delete-modal";
import type { ReleaseTagOperationsCallbacks } from "./inline-form";
import { CreateUpdateReleaseTagInline } from "./inline-form";
import { ReleaseTagItem } from "./tag-item";
import { useReleasePermissions } from "@/hooks/permissions/use-release-permissions";

type Props = {
  workspaceSlug: string;
};

export const ReleasesTagList = observer(function ReleasesTagList({ workspaceSlug }: Props) {
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteTag, setSelectDeleteTag] = useState<ReleaseTag | null>(null);

  const releaseTagPermissions = useReleasePermissions(workspaceSlug).getTagPermissions();

  const {
    data: tags,
    isLoading,
    mutate,
  } = useSWR(`RELEASE_TAGS_${workspaceSlug}`, () => releaseService.listTags(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  const handleError = (error: unknown) => {
    const errorObj = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    const versionErrors = Array.isArray(errorObj["version"]) ? (errorObj["version"] as string[]) : [];
    if (versionErrors[0] === "RELEASE_TAG_VERSION_ALREADY_EXISTS") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("releases.settings.tags.errors.version_already_exists"),
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("releases.settings.tags.errors.generic"),
      });
    }
  };

  const tagOperationsCallbacks: ReleaseTagOperationsCallbacks = {
    createTag: async (data: ReleaseTagWrite) => {
      try {
        const created = await releaseService.createTag(workspaceSlug, data);
        mutate((prev) => (prev ? [...prev, created] : [created]), false);
        return created;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    updateTag: async (tagId: string, data: Partial<ReleaseTagWrite>) => {
      try {
        const updated = await releaseService.updateTag(workspaceSlug, tagId, data);
        mutate((prev) => prev?.map((t) => (t.id === tagId ? updated : t)), false);
        return updated;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  };

  const newTag = () => {
    setIsUpdating(false);
    setShowForm(true);
  };

  return (
    <>
      <DeleteReleaseTagModal
        isOpen={!!selectDeleteTag}
        data={selectDeleteTag}
        onClose={() => setSelectDeleteTag(null)}
        workspaceSlug={workspaceSlug}
        onSuccess={() => mutate((prev) => prev?.filter((t) => t.id !== selectDeleteTag?.id), false)}
      />

      <SettingsHeading
        title={t("releases.settings.tags.title")}
        description={t("releases.settings.tags.description")}
        control={
          releaseTagPermissions.canCreate && (
            <Button onClick={newTag} variant="secondary">
              {t("releases.settings.tags.add")}
            </Button>
          )
        }
        className="border-b-0"
        variant="h6"
      />

      <div className="mt-4 w-full bg-layer-3 rounded-lg border border-subtle p-2">
        {showForm && (
          <div className="w-full rounded border border-subtle mb-2">
            <CreateUpdateReleaseTagInline
              isUpdating={isUpdating}
              tagOperationsCallbacks={tagOperationsCallbacks}
              onClose={() => {
                setShowForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}

        {isLoading && !showForm ? (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        ) : tags && tags.length === 0 && !showForm ? (
          <EmptyStateCompact
            assetKey="label"
            assetClassName="size-20"
            title={t("releases.settings.tags.empty_state")}
            description=""
            actions={
              releaseTagPermissions.canCreate ? [{ label: t("releases.settings.tags.add"), onClick: newTag }] : []
            }
            align="start"
            rootClassName="py-20"
          />
        ) : (
          tags &&
          tags.map((tag, index) => (
            <ReleaseTagItem
              key={tag.id}
              tag={tag}
              setIsUpdating={setIsUpdating}
              handleTagDelete={(t) => setSelectDeleteTag(t)}
              tagOperationsCallbacks={tagOperationsCallbacks}
              permissions={{
                canEdit: releaseTagPermissions.getCanEdit(tag.id),
                canDelete: releaseTagPermissions.getCanDelete(tag.id),
              }}
            />
          ))
        )}
      </div>
    </>
  );
});
