"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Link, Paperclip } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// hooks
import { InitiativeAttachmentActionButton } from "./attachment-button";
import { InitiativeLinksActionButton } from "./link-button";
import { InitiativeReactions } from "./reactions";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeInfoActionItems: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled } = props;
  const { t } = useTranslation();
  return (
    <>
      <InitiativeReactions workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      <div className="flex items-center gap-2">
        <InitiativeLinksActionButton
          customButton={
            <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
              <Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium">{t("add_link")}</span>
            </div>
          }
          disabled={disabled}
        />
        <InitiativeAttachmentActionButton
          workspaceSlug={workspaceSlug.toString()}
          initiativeId={initiativeId}
          customButton={
            <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
              <Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium">{t("common.attach")}</span>
            </div>
          }
          disabled={disabled}
        />
      </div>
    </>
  );
});
