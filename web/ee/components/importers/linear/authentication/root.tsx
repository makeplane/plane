"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// plane web components
import { OAuth, PersonalAccessTokenAuth } from "@/plane-web/components/importers/linear";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth },
  } = useLinearImporter();

  if (currentAuth?.isAuthenticated) return null;

  return <Fragment>{currentAuth?.isOAuthEnabled ? <OAuth /> : <PersonalAccessTokenAuth />}</Fragment>;
});
