/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FormEvent } from "react";
import { useState } from "react";
// types
import { observer } from "mobx-react";
import { ETabIndices, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon, WikiIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { EUserProjectRoles } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { cn, copyUrlToClipboard, getTabIndex } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  handleModalClose: () => void;
  handleConvertToPage: (projectId: string | undefined) => Promise<
    | {
        page_url: string;
      }
    | undefined
  >;
};
const ActionItems = ({ pageUrl }: { pageUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyUrlToClipboard(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex items-center gap-3 text-xs text-secondary mt-1">
      <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-11 font-medium text-accent-primary">
        View page
      </a>
      <button onClick={copyToClipboard} className="text-11 font-medium text-accent-primary">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
};
export const SavePageModal: React.FC<Props> = observer((props) => {
  const { workspaceSlug, isOpen, handleModalClose, handleConvertToPage } = props;
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(undefined);
  // hooks
  const { isMobile } = usePlatformOS();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  const options = workspaceProjectIds
    ?.filter((projectId) =>
      allowPermissions(
        [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug,
        projectId
      )
    )
    .map((projectId: string) => {
      const projectDetails = getProjectById(projectId);

      return {
        value: projectDetails?.id,
        query: `${projectDetails?.name} ${projectDetails?.identifier}`,
        content: (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-layer-1">
              <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                {projectDetails?.logo_props ? (
                  <Logo logo={projectDetails?.logo_props} size={16} />
                ) : (
                  <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                    <ProjectIcon className="h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
            <p className="text-13 font-medium">{projectDetails?.name}</p>
          </div>
        ),
      };
    });
  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_PAGE, isMobile);

  const handleEditFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleConvertToPage(selectedEntity === "wiki" ? undefined : selectedEntity)
      .then((response) => {
        setIsSubmitting(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page saved successfully.",
          actionItems: <ActionItems pageUrl={response?.page_url ?? ""} />,
        });
        handleModalClose();
        return;
      })
      .catch(() => {
        setIsSubmitting(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong please try again later.",
        });
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleModalClose} position={EModalPosition.TOP} width={EModalWidth.SM}>
      <form onSubmit={(e) => void handleEditFormSubmit(e)}>
        <div className="p-5">
          <h3 className="text-h5-medium text-primary mb-2">Save this page in</h3>
          {/* search project */}
          <div className="flex-grow w-full">
            <Input
              id="name"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for projects"
              className="w-full border border-subtle-1 text-body-sm-regular text-secondary py-1"
              tabIndex={getIndex("search")}
            />
          </div>
          <div className="divide-y divide-subtle">
            {/* wiki */}
            <div className="py-2">
              <button
                className={cn("flex items-center gap-2 hover:bg-layer-1 rounded-md p-2 w-full", {
                  "bg-layer-1": selectedEntity === "wiki",
                })}
                onClick={() => setSelectedEntity("wiki")}
                type="button"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-layer-1">
                  <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                    <WikiIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-body-sm-medium text-primary">Wiki</p>
              </button>
            </div>
            {/* projects */}
            <div className="py-4">
              <h4 className="text-caption-md-semibold text-placeholder mb-4">Projects</h4>
              <div className="flex flex-col max-h-[308px] overflow-y-scroll">
                {filteredOptions?.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={cn("hover:bg-layer-1 text-start rounded-md p-2 text-body-sm-medium text-primary", {
                      "bg-layer-1": selectedEntity === option.value,
                    })}
                    onClick={() => setSelectedEntity(option.value)}
                  >
                    {option.content}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border border-subtle">
          <Button variant="secondary" size="lg" onClick={handleModalClose} tabIndex={getIndex("cancel")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            tabIndex={getIndex("submit")}
          >
            {isSubmitting ? "Saving" : "Save"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
