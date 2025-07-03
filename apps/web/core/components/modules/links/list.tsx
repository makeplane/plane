"use client";
import { useCallback } from "react";
import { observer } from "mobx-react";
// plane types
import { ILinkDetails } from "@plane/types";
// components
import { ModulesLinksListItem } from "@/components/modules";
// hooks
import { useModule } from "@/hooks/store";

type Props = {
  disabled?: boolean;
  handleDeleteLink: (linkId: string) => void;
  handleEditLink: (link: ILinkDetails) => void;
  moduleId: string;
};

export const ModuleLinksList: React.FC<Props> = observer((props) => {
  const { moduleId, handleDeleteLink, handleEditLink, disabled } = props;
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const currentModule = getModuleById(moduleId);
  const moduleLinks = currentModule?.link_module;
  // memoized link handlers
  const memoizedDeleteLink = useCallback((id: string) => handleDeleteLink(id), [handleDeleteLink]);
  const memoizedEditLink = useCallback((link: ILinkDetails) => handleEditLink(link), [handleEditLink]);

  if (!moduleLinks) return null;

  return (
    <>
      {moduleLinks.map((link) => (
        <ModulesLinksListItem
          key={link.id}
          handleDeleteLink={() => memoizedDeleteLink(link.id)}
          handleEditLink={() => memoizedEditLink(link)}
          isEditingAllowed={!disabled}
          link={link}
        />
      ))}
    </>
  );
});
