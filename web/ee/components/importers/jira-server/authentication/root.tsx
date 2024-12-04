"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { PersonalAccessTokenAuth } from "@/plane-web/components/importers/jira-server";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth },
  } = useJiraServerImporter();

  if (currentAuth?.isAuthenticated) return null;

  return <PersonalAccessTokenAuth />;
});
