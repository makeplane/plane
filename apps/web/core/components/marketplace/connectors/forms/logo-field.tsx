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
import { useFormContext } from "react-hook-form";
import { Camera, Image } from "lucide-react";
import { AppImageUploadModal } from "@/components/common/modal/upload-app-image";
import { cn, getFileURL } from "@plane/utils";
import { EFileAssetType } from "@plane/types";
import { useState } from "react";
import type { TConnectorFormData, TConnector } from "@plane/types";
export function LogoField({
  isMetadataEditable,
  preloadData,
}: {
  isMetadataEditable: boolean;
  preloadData?: TConnector;
}) {
  const { setValue, watch } = useFormContext<TConnectorFormData>();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  return (
    <div className="flex gap-4">
      <AppImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSuccess={(url) => setValue("logo_url", getFileURL(url) ?? "")}
        initialValue={preloadData?.logo_url ? (getFileURL(preloadData?.logo_url) ?? null) : null}
        handleRemove={async () => setValue("logo_url", undefined)}
        entityType={EFileAssetType.OAUTH_APP_LOGO}
      />

      <div className="space-y-2 size-14">
        {watch("logo_url") ? (
          <img
            loading="lazy"
            src={getFileURL(watch("logo_url") ?? "")}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center w-full h-full gap-2 p-5 bg-surface-1 rounded-sm border border-subtle",
              {
                "opacity-50": !isMetadataEditable,
              }
            )}
          >
            <Image className="size-6 text-icon-disabled" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => isMetadataEditable && setIsImageModalOpen(true)}
        className={cn("text-body-xs-semibold text-accent-primary", {
          "opacity-50 cursor-not-allowed": !isMetadataEditable,
        })}
        disabled={!isMetadataEditable}
      >
        Upload logo
      </button>
    </div>
  );
}
