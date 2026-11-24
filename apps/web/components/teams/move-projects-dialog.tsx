/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// plane imports
import { ROLE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import type { EUserPermissions } from "@plane/constants";
import type { TPortfolio, TProjectAccessChange } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTeam } from "@/hooks/store/use-team";
// local imports
import { getTeamErrorKey } from "./helper";
import { PortfolioSelect } from "./portfolio-select";
import { useTeamAction } from "./use-team-action";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectIds: string[];
  portfolios?: TPortfolio[];
  onClose: () => void;
};

type TChangeRow = TProjectAccessChange & { projectId: string };
type TPreview = { gained: TChangeRow[]; lost: TChangeRow[]; changed: TChangeRow[] };

const roleName = (role: number | null) => (role === null ? "" : ROLE[role as EUserPermissions]);

/** Moves projects to a portfolio after showing who gains and loses access. */
export const MoveProjectsDialog = observer(function MoveProjectsDialog(props: Props) {
  const { isOpen, workspaceSlug, projectIds, portfolios, onClose } = props;
  // states
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TPreview | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Only the answer to the latest choice may be shown
  const requestRef = useRef(0);
  // store hooks
  const { getProjectById } = useProject();
  const { previewMove, moveProjects } = useTeam();
  const run = useTeamAction();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    requestRef.current += 1;
    setPortfolioId(null);
    setPreview(null);
    setErrorKey(null);
  }, [isOpen]);

  const handleSelect = async (nextPortfolioId: string) => {
    requestRef.current += 1;
    const request = requestRef.current;
    setPortfolioId(nextPortfolioId);
    setPreview(null);
    setErrorKey(null);
    try {
      const results = await Promise.all(
        projectIds.map(async (projectId) => ({
          projectId,
          result: await previewMove(workspaceSlug, projectId, nextPortfolioId),
        }))
      );
      if (request !== requestRef.current) return;
      const collect = (key: keyof TPreview) =>
        results.flatMap(({ projectId, result }) => result[key].map((change) => Object.assign({ projectId }, change)));
      setPreview({ gained: collect("gained"), lost: collect("lost"), changed: collect("changed") });
    } catch (error) {
      if (request === requestRef.current) setErrorKey(getTeamErrorKey(error));
    }
  };

  const handleSubmit = async () => {
    if (!portfolioId) return;
    setIsSubmitting(true);
    const isDone = await run(() => moveProjects(workspaceSlug, projectIds, portfolioId));
    setIsSubmitting(false);
    if (!isDone) return;
    setToast({ type: "success", title: t("toast.success"), message: t("team_structure.move.done") });
    onClose();
  };

  const renderChanges = (title: string, changes: TChangeRow[]) =>
    changes.length > 0 && (
      <div className="space-y-1">
        <p className="text-body-xs-semibold text-secondary">
          {title} ({changes.length})
        </p>
        <ul className="max-h-40 space-y-0.5 overflow-y-auto text-body-xs-regular text-tertiary">
          {changes.map((change) => (
            <li key={`${change.projectId}-${change.member}`}>
              {change.display_name}
              {projectIds.length > 1 && ` · ${getProjectById(change.projectId)?.name ?? ""}`}
              {" · "}
              {[roleName(change.before), roleName(change.after)].filter(Boolean).join(" → ")}
            </li>
          ))}
        </ul>
      </div>
    );

  const hasChanges = !!preview && preview.gained.length + preview.lost.length + preview.changed.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("team_structure.move.title")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="space-y-4">
              <p className="text-body-xs-regular text-tertiary">
                {projectIds.map((projectId) => getProjectById(projectId)?.name).join(", ")}
              </p>
              <PortfolioSelect
                value={portfolioId}
                onChange={(value) => void handleSelect(value)}
                portfolios={portfolios}
                disabled={isSubmitting}
              />
              {errorKey && <p className="text-body-xs-regular text-danger-primary">{t(errorKey)}</p>}
              {portfolioId && !preview && !errorKey && (
                <Loader className="space-y-2">
                  <Loader.Item height="20px" />
                  <Loader.Item height="20px" />
                </Loader>
              )}
              {preview && !hasChanges && (
                <p className="text-body-xs-regular text-tertiary">{t("team_structure.move.no_changes")}</p>
              )}
              {preview && renderChanges(t("team_structure.move.gained"), preview.gained)}
              {preview && renderChanges(t("team_structure.move.lost"), preview.lost)}
              {preview && renderChanges(t("team_structure.move.changed"), preview.changed)}
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            disabled={!preview}
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
            label={t("team_structure.move.action")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
