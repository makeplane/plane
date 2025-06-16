"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleCheckBig } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TUserApplication } from "@plane/types";
import { Button } from "@plane/ui";
import { getFileURL  } from "@plane/utils";
import { ApplicationTileMenuOptions } from "@/plane-web/components/marketplace";

// display app details like name, logo, description
// button and more options to edit, delete, publish

type AppTileProps = {
  app: TUserApplication;
};

export const AppTile: React.FC<AppTileProps> = (props) => {
  const { app } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-custom-border-100 py-2">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          {app?.logo_url ? (
            <img src={getFileURL(app.logo_url)} alt={app.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-custom-background-80 flex items-center justify-center">
              <div className="text-lg font-medium">{app.name.charAt(0)}</div>
            </div>
          )}
          <div className="text-lg font-medium">{app.name}</div>
        </div>
        <div className="text-sm">{app.short_description}</div>
      </div>

      <div className="flex items-center space-x-1">
        {app.is_installed ? (
          <div className="flex items-center space-x-1">
            <div>
              <CircleCheckBig className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-sm text-custom-text-350 font-medium">
              {t("workspace_settings.settings.applications.connected")}
            </div>
          </div>
        ) : (
          <Link href={`${app.id}/install`}>
            <Button variant="link-primary" className="bg-blue-500/20">
              Connect new
            </Button>
          </Link>
        )}
        {app.is_owned && <ApplicationTileMenuOptions app={app} />}
      </div>
    </div>
  );
};
