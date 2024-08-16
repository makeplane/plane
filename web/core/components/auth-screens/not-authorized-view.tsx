import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// images
import ProjectNotAuthorizedImg from "@/public/auth/project-not-authorized.svg";
import Unauthorized from "@/public/auth/unauthorized.svg";
import WorkspaceNotAuthorizedImg from "@/public/auth/workspace-not-authorized.svg";

type Props = {
  actionButton?: React.ReactNode;
  section?: "settings" | "general";
  isProjectView?: boolean;
};

export const NotAuthorizedView: React.FC<Props> = observer((props) => {
  const { actionButton, section = "general", isProjectView = false } = props;

  // assets
  const settingAsset = isProjectView ? ProjectNotAuthorizedImg : WorkspaceNotAuthorizedImg;
  const asset = section === "settings" ? settingAsset : Unauthorized;

  return (
    <DefaultLayout>
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 bg-custom-background-100 text-center">
        <div className="h-44 w-72">
          <Image src={asset} height="176" width="288" alt="ProjectSettingImg" />
        </div>
        <h1 className="text-xl font-medium text-custom-text-100">Oops! You are not authorized to view this page</h1>
        {actionButton}
      </div>
    </DefaultLayout>
  );
});
