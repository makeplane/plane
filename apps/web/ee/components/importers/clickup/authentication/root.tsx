"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// plane web components
import { PersonalAccessTokenAuth } from "@/plane-web/components/importers/clickup";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth },
  } = useClickUpImporter();

  if (currentAuth?.isAuthenticated) return null;

  return (
    <Fragment>
      <PersonalAccessTokenAuth />
    </Fragment>
  );
});
