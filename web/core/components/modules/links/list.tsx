"use client";
import { observer } from "mobx-react";
// plane types
import { ILinkDetails, UserAuth } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ModulesLinksListItem } from "@/components/modules";
// hooks
import { useMember, useModule } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  disabled?: boolean;
  handleDeleteLink: (linkId: string) => void;
  handleEditLink: (link: ILinkDetails) => void;
  moduleId: string;
  userAuth: UserAuth;
};

export const ModuleLinksList: React.FC<Props> = observer((props) => {
  const { moduleId, handleDeleteLink, handleEditLink, userAuth, disabled } = props;
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const currentModule = getModuleById(moduleId);
  const moduleLinks = currentModule?.link_module;

  if (!moduleLinks) return null;

  return (
    <>
      {moduleLinks.map((link) => (
        <ModulesLinksListItem
          key={link.id}
          handleDeleteLink={() => handleDeleteLink(link.id)}
          handleEditLink={() => handleEditLink(link)}
          isEditingAllowed={(userAuth.isMember || userAuth.isOwner) && !disabled}
          link={link}
        />
      ))}
    </>
  );
});
