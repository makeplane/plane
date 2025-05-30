"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { OAuth, PersonalAccessTokenAuth } from "@/plane-web/components/importers/asana";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

export const AuthenticationRoot: FC = observer(() => {
  // hooks
  const {
    auth: { currentAuth },
  } = useAsanaImporter();
  const { t } = useTranslation();

  if (currentAuth?.isAuthenticated) return <div>{t("common.authenticated")}</div>;

  return <>{currentAuth?.isOAuthEnabled ? <OAuth /> : <PersonalAccessTokenAuth />}</>;
});
