"use client"
import React from "react";
import { TUserApplication } from "@plane/types";
import { AppTile } from "@/plane-web/components/marketplace";

// list all the applications
// have tabs to filter by category
// have search bar to search by name

type AppListProps = {
    apps: TUserApplication[];
}

export const AppList: React.FC<AppListProps> = (props) => {
    const { apps } = props;

    return (
        <div className="pb-20">
            {apps.map((app) => (
                <div key={app.id}>
                    <AppTile app={app} />
                </div>
            ))}
        </div>
    )
}