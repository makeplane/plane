"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { OAuth, PersonalAccessTokenAuth } from "@/plane-web/components/importers/asana";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth },
  } = useAsanaImporter();

  if (currentAuth?.isAuthenticated) return <div>Already authenticated</div>;

  return <div>{currentAuth?.isOAuthEnabled ? <OAuth /> : <PersonalAccessTokenAuth />}</div>;
});
