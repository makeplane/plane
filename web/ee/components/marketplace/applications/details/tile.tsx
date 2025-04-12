"use client"

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleCheckBig } from "lucide-react";
import { TUserApplication } from "@plane/types";
import { Button } from "@plane/ui";
import { ApplicationTileMenuOptions } from "@/plane-web/components/marketplace";
import { getFileURL } from "@/helpers/file.helper";
import { useTranslation } from "@plane/i18n";

// display app details like name, logo, description
// button and more options to edit, delete, publish

type AppTileProps = {
    app: TUserApplication;
}

export const AppTile: React.FC<AppTileProps> = (props) => {
    const { app } = props;
    const { workspaceSlug } = useParams();
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between border-b border-custom-border-100 py-5">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                    <img src={app?.logo_url ? getFileURL(app.logo_url) : ""} alt={app.name} className="w-8 h-8 rounded-full" />
                    <div className="text-lg font-medium">{app.name}</div>
                </div>
                <div className="text-sm">{app.short_description}</div>
            </div>

            <div className="flex items-center space-x-1">
                {
                    app.is_installed ?
                        <div className="flex items-center space-x-1">
                            <div>
                                <CircleCheckBig className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-sm custom-text-200">{t("workspace_settings.settings.applications.connected")}</div>
                        </div>
                        :
                        <Link href={`${app.id}/install`}>
                            <Button variant="link-primary" className="bg-blue-500/20">{t("workspace_settings.settings.applications.connect")}</Button>
                        </Link>
                }
                {
                    app.is_owned &&
                    <ApplicationTileMenuOptions app={app} />
                }
            </div>
        </div>
    )
}