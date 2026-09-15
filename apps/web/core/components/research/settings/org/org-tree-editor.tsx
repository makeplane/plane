/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ORG_UNIT_CHILD_TYPES, ORG_UNIT_TYPE_LABELS } from "@plane/constants";
import type { TOrgUnitType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TOrgUnit } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";
// local imports
import { ResearchMentorBindings } from "./mentor-bindings";
import { ResearchOrgMemberTable } from "./org-member-table";

type Props = {
  workspaceSlug: string;
};

type OrgTreeNode = TOrgUnit & { children: OrgTreeNode[] };

const buildTree = (units: TOrgUnit[]): OrgTreeNode[] => {
  const nodes = new Map<string, OrgTreeNode>();
  units.forEach((unit) => nodes.set(unit.id, { ...unit, children: [] }));
  const roots: OrgTreeNode[] = [];
  units.forEach((unit) => {
    const node = nodes.get(unit.id);
    if (!node) return;
    if (unit.parent && nodes.has(unit.parent)) nodes.get(unit.parent)?.children.push(node);
    else roots.push(node);
  });
  return roots;
};

type TreeNodeRowProps = {
  node: OrgTreeNode;
  selectedId: string | null;
  onSelect: (unit: TOrgUnit) => void;
  onAddChild: (unit: TOrgUnit) => void;
  addLabel: string;
  depth?: number;
};

const TreeNodeRow = observer(function TreeNodeRow({
  node,
  selectedId,
  onSelect,
  onAddChild,
  addLabel,
  depth = 0,
}: TreeNodeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-13 ${
          selectedId === node.id ? "bg-surface-2 text-primary" : "text-secondary hover:bg-surface-2"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button type="button" className="w-3 text-10 text-placeholder" onClick={() => setExpanded((value) => !value)}>
          {hasChildren ? (expanded ? "-" : "+") : ""}
        </button>
        <button type="button" className="flex-1 truncate text-left" onClick={() => onSelect(node)}>
          {node.name}
        </button>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-10 text-tertiary">
          {t(ORG_UNIT_TYPE_LABELS[node.unit_type as TOrgUnitType])}
        </span>
        {node.unit_type !== "ROOT" && (
          <button
            type="button"
            className="hidden text-10 text-accent-primary group-hover:inline"
            onClick={() => onAddChild(node)}
          >
            {addLabel}
          </button>
        )}
      </div>
      {expanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            addLabel={addLabel}
            depth={depth + 1}
          />
        ))}
    </div>
  );
});

/**
 * Organisation tree editor with a detail panel for members, principal
 * investigators and direct advisor bindings (P0-UI-04).
 */
export const ResearchOrgTreeEditor = observer(function ResearchOrgTreeEditor({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [tab, setTab] = useState<"members" | "mentors">("members");
  const [nameDraft, setNameDraft] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitType, setNewUnitType] = useState<TOrgUnitType>("GROUP");
  const [parentForNewUnit, setParentForNewUnit] = useState<string | null | undefined>(undefined);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const units = research.getOrgUnits(workspaceSlug);
  const tree = useMemo(() => buildTree(units), [units]);
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;

  useEffect(() => {
    void research.fetchOrgUnits(workspaceSlug).catch((error) => setErrorKey(getResearchErrorKey(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  useEffect(() => {
    if (!selectedUnitId && units.length > 0) setSelectedUnitId(units[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units.length]);

  useEffect(() => {
    setNameDraft(selectedUnit?.name ?? "");
  }, [selectedUnit?.id, selectedUnit?.name]);

  const openCreateDialog = useCallback((parent: TOrgUnit | null) => {
    setParentForNewUnit(parent?.id ?? null);
    setNewUnitName("");
    setNewUnitType(parent ? "GROUP" : "ROOT");
  }, []);

  const handleCreate = useCallback(
    async (parentId: string | null) => {
      if (!newUnitName.trim()) return;
      try {
        const unit = await research.createOrgUnit(workspaceSlug, {
          name: newUnitName.trim(),
          unit_type: newUnitType,
          parent: parentId,
        });
        setSelectedUnitId(unit.id);
        setParentForNewUnit(undefined);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [newUnitName, newUnitType, research, workspaceSlug]
  );

  const handleRename = useCallback(
    async (unit: TOrgUnit) => {
      const nextName = nameDraft.trim();
      if (!nextName || nextName === unit.name) return;
      try {
        await research.updateOrgUnit(workspaceSlug, unit.id, { name: nextName });
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [nameDraft, research, workspaceSlug]
  );

  const handleDelete = useCallback(
    async (unit: TOrgUnit) => {
      try {
        await research.deleteOrgUnit(workspaceSlug, unit.id);
        setSelectedUnitId(null);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, workspaceSlug]
  );

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden p-4">
      <div className="flex w-80 flex-col gap-2 overflow-hidden rounded-lg border border-subtle bg-surface-1 p-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-13 font-medium text-primary">{t("research.org.title")}</span>
          <Button variant="secondary" size="sm" onClick={() => openCreateDialog(null)}>
            {t("research.org.new_root")}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tree.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              selectedId={selectedUnitId}
              onSelect={(unit) => setSelectedUnitId(unit.id)}
              onAddChild={(unit) => openCreateDialog(unit)}
              addLabel={t("research.org.add_child")}
            />
          ))}
          {tree.length === 0 && <p className="p-2 text-12 text-tertiary">{t("research.org.no_nodes")}</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-lg border border-subtle bg-surface-1 p-4">
        {errorKey && (
          <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
            {t(errorKey)}
          </div>
        )}

        {selectedUnit ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Input
                  className="!w-64"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  onBlur={() => void handleRename(selectedUnit)}
                />
                <span className="text-12 text-tertiary">{t("research.org.depth", { depth: selectedUnit.depth })}</span>
              </div>
              <Button
                variant="error-outline"
                size="sm"
                disabled={selectedUnit.unit_type === "ROOT"}
                onClick={() => void handleDelete(selectedUnit)}
              >
                {t("research.org.delete_node")}
              </Button>
            </div>

            <div className="flex gap-2 border-b border-subtle">
              {(["members", "mentors"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`-mb-px border-b-2 px-2 py-1.5 text-12 ${
                    tab === value
                      ? "border-accent-primary text-primary"
                      : "border-transparent text-tertiary hover:text-secondary"
                  }`}
                  onClick={() => setTab(value)}
                >
                  {value === "members" ? t("research.org.tab_members") : t("research.org.tab_mentors")}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "members" ? (
                <ResearchOrgMemberTable workspaceSlug={workspaceSlug} unit={selectedUnit} />
              ) : (
                <ResearchMentorBindings workspaceSlug={workspaceSlug} unit={selectedUnit} />
              )}
            </div>
          </>
        ) : (
          <p className="text-13 text-tertiary">{t("research.org.select_hint")}</p>
        )}
      </div>

      {parentForNewUnit !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg border border-subtle bg-surface-1 p-4">
            <h3 className="text-14 font-medium text-primary">
              {parentForNewUnit ? t("research.org.new_child") : t("research.org.new_root")}
            </h3>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                placeholder={t("research.org.name_placeholder")}
                value={newUnitName}
                onChange={(event) => setNewUnitName(event.target.value)}
              />
              <select
                className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
                value={newUnitType}
                onChange={(event) => setNewUnitType(event.target.value as TOrgUnitType)}
                disabled={!parentForNewUnit}
              >
                {(parentForNewUnit ? ORG_UNIT_CHILD_TYPES : (["ROOT"] as const)).map((type) => (
                  <option key={type} value={type}>
                    {t(ORG_UNIT_TYPE_LABELS[type as TOrgUnitType])}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setParentForNewUnit(undefined)}>
                {t("research.common.cancel")}
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleCreate(parentForNewUnit)}>
                {t("research.common.create")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
