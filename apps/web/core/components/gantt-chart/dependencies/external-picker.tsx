/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { ISearchIssueResponse } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";
import { ProjectService } from "@/services/project/project.service";

const projectService = new ProjectService();

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onSelect: (issueId: string, projectId: string) => void;
};

export const ExternalPicker = observer(function ExternalPicker({ x, y, onClose, onSelect }: Props) {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug?.toString();
  const projectId = params.projectId?.toString();
  const { getProjectById, getProjectByIdentifier } = useProject();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ISearchIssueResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) onClose();
    };
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", cancel, true);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("keydown", cancel, true);
    };
  }, [onClose]);

  useEffect(() => {
    setResults([]);
    setFailed(false);
    if (!query.trim() || !workspaceSlug || !projectId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void projectService
        .projectIssuesSearch(workspaceSlug, projectId, { search: query.trim(), workspace_search: true })
        .then((issues) => {
          if (active) setResults(issues);
        })
        .catch(() => {
          if (active) setFailed(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, workspaceSlug, projectId]);

  const matches = results
    .flatMap((issue) => {
      const project = issue.project_id
        ? getProjectById(issue.project_id)
        : getProjectByIdentifier(issue.project__identifier);
      if (!project || project.id === projectId || (getProjectById(project.id)?.member_role ?? 0) < 15) return [];
      return [
        {
          ...issue,
          projectId: project.id,
          code: `${issue.project__identifier || project.identifier}-${issue.sequence_id}`,
        },
      ];
    })
    .slice(0, 8);

  return (
    <div
      ref={popoverRef}
      data-gantt-dependency-control
      className="pointer-events-auto absolute z-[8] w-80 max-w-full rounded border border-subtle bg-layer-1 p-2 text-11 text-primary shadow-lg"
      style={{ left: x, top: y }}
    >
      <div className="mb-2 font-medium">Nối với việc ở project khác</div>
      <input
        ref={inputRef}
        value={query}
        aria-label="Tìm việc ở project khác"
        placeholder="Tìm mã hoặc tên việc"
        className="w-full rounded border border-subtle bg-layer-1 px-2 py-1 text-primary"
        onChange={(event) => {
          setQuery(event.target.value);
          setResults([]);
        }}
      />
      <div className="mt-1" aria-live="polite">
        {loading ? (
          <div className="p-1 text-tertiary">Đang tìm…</div>
        ) : failed ? (
          <div className="p-1 text-danger-primary">Không tìm được việc, hãy thử lại</div>
        ) : (
          matches.map((issue) => (
            <button
              key={issue.id}
              type="button"
              className="flex w-full gap-2 rounded px-2 py-1 text-left hover:bg-layer-transparent"
              onClick={() => onSelect(issue.id, issue.projectId)}
            >
              <span className="shrink-0 text-tertiary">{issue.code}</span>
              <span className="truncate">{issue.name}</span>
            </button>
          ))
        )}
        {!loading && !failed && query.trim() && !matches.length && (
          <div className="p-1 text-tertiary">Không có việc phù hợp</div>
        )}
      </div>
    </div>
  );
});
