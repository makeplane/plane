/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomMenu, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane-web hooks
import { useProjectCopy } from "@/plane-web/hooks/store/use-project-copy";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  projectIdentifier: string;
};

export const CopyToWorkspaceModal = observer(function CopyToWorkspaceModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, projectId, projectName, projectIdentifier } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaces } = useWorkspace();
  const store = useProjectCopy();
  // states
  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState<string>("");
  const [name, setName] = useState(`${projectName} (copy)`);
  const [identifier, setIdentifier] = useState(projectIdentifier);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  // Workspaces the user belongs to, excluding the current workspace
  const targetWorkspaces = Object.values(workspaces).filter((ws) => ws.slug !== workspaceSlug);
  const filteredWorkspaces = workspaceSearch
    ? targetWorkspaces.filter((ws) => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
    : targetWorkspaces;

  const isJobActive = store.activeJob !== null && ["queued", "processing"].includes(store.activeJob.status);

  const handleClose = () => {
    if (isSubmitting) return;
    store.stopPolling();
    setSelectedWorkspaceSlug("");
    setName(`${projectName} (copy)`);
    setIdentifier(projectIdentifier);
    setIdentifierError(null);
    setWorkspaceSearch("");
    onClose();
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value.toUpperCase().slice(0, 12));
    if (identifierError) setIdentifierError(null);
  };

  // Auto-close when copy completes
  useEffect(() => {
    if (store.activeJob?.status === "completed") {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activeJob?.status]);

  const handleSubmit = async () => {
    if (!selectedWorkspaceSlug || !identifier || !name) return;

    setIsSubmitting(true);
    try {
      await store.enqueueCopy(workspaceSlug, projectId, {
        target_workspace_slug: selectedWorkspaceSlug,
        identifier: identifier.toUpperCase(),
        name,
      });
    } catch (err: unknown) {
      const apiErr = err as { error?: string } | null;
      if (apiErr?.error === "identifier_conflict") {
        setIdentifierError(t("copy_project.identifier_conflict"));
      } else {
        setToast({ type: TOAST_TYPE.ERROR, title: t("copy_project.error") });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-6 space-y-5">
        {/* Title */}
        <h3 className="text-base font-semibold text-primary">{t("copy_project.modal_title")}</h3>

        {isJobActive ? (
          // In-progress state
          <div className="flex items-center gap-3 py-4">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            <span className="text-sm text-secondary">{t("copy_project.in_progress")}</span>
          </div>
        ) : (
          // Form fields
          <div className="space-y-4">
            {/* Target workspace dropdown */}
            <div className="space-y-1">
              <label className="block text-13 font-medium text-primary">
                {t("copy_project.target_workspace_label")}
              </label>
              <CustomMenu
                label={
                  selectedWorkspaceSlug
                    ? (targetWorkspaces.find((ws) => ws.slug === selectedWorkspaceSlug)?.name ?? selectedWorkspaceSlug)
                    : t("copy_project.target_workspace_label")
                }
                className="w-full"
                buttonClassName="w-full flex justify-between items-center px-3 py-2 text-sm bg-layer-2 border-[0.5px] border-subtle rounded text-primary"
                disabled={isSubmitting}
              >
                <div className="p-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={workspaceSearch}
                    onChange={(e) => setWorkspaceSearch(e.target.value)}
                    placeholder={t("copy_project.search_workspace_placeholder")}
                    className="w-full"
                  />
                </div>
                {filteredWorkspaces.map((ws) => (
                  <CustomMenu.MenuItem key={ws.slug} onClick={() => setSelectedWorkspaceSlug(ws.slug)}>
                    {ws.name}
                  </CustomMenu.MenuItem>
                ))}
              </CustomMenu>
            </div>

            {/* Project name */}
            <div className="space-y-1">
              <label className="block text-13 font-medium text-primary">{t("copy_project.project_name_label")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-layer-2"
                disabled={isSubmitting}
              />
            </div>

            {/* Identifier */}
            <div className="space-y-1">
              <label className="block text-13 font-medium text-primary">{t("copy_project.identifier_label")}</label>
              <Input
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                className="w-full bg-layer-2"
                disabled={isSubmitting}
                hasError={!!identifierError}
                maxLength={12}
              />
              {identifierError ? (
                <p className="text-xs text-danger-primary">{identifierError}</p>
              ) : (
                <p className="text-xs text-tertiary">{t("copy_project.identifier_hint")}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          {isJobActive ? (
            <Button variant="secondary" onClick={handleClose} size="sm">
              {t("close")}
            </Button>
          ) : (
            <>
              <Button variant="tertiary" onClick={handleClose} size="sm" disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                disabled={isSubmitting || !selectedWorkspaceSlug || !identifier || !name}
                onClick={() => void handleSubmit()}
              >
                {t("copy_project.copy_button")}
              </Button>
            </>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
