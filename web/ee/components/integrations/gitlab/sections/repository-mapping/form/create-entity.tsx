"use client";

import { Dispatch, FC, SetStateAction, useState } from "react";
import { observer } from "mobx-react";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { EntityForm } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TGitlabEntityConnection, TProjectMap } from "@/plane-web/types/integrations/gitlab";
// local imports
import { projectMapInit } from "../root";

type TEntityFormCreate = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
};

export const EntityFormCreate: FC<TEntityFormCreate> = observer((props) => {
  // props
  const { modal, handleModal } = props;

  // hooks
  const {
    entityConnection: { createEntityConnection },
  } = useGitlabIntegration();

  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);

  // handlers
  const handleProjectMapChange = <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => {
      setProjectMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload: Partial<TGitlabEntityConnection> = {
        entityId: projectMap.entityId,
        projectId: projectMap.projectId,
      };
      await createEntityConnection(payload);

      handleModal(false);
    } catch (error) {
      console.error("handleSubmit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-xl font-medium text-custom-text-200">Link Gitlab Project or Group</div>

        <div className="space-y-4">
          <EntityForm value={projectMap} handleChange={handleProjectMapChange} />

          <div className="border border-custom-border-200 divide-y divide-custom-border-200 rounded">
            <div className="relative space-y-1 p-3">
              <div className="text-base">Pull request automation</div>
              <div className="text-xs text-custom-text-200">
                With Gitlab integration Enabled, you can automate issue workflows
              </div>
            </div>
          </div>

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={() => handleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? "Processing" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
