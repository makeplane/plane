/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBoardProduct, TBoardState, TStateGroups } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { ProductIndicatorBadge } from "@/components/products/indicator-badge";
// local imports
import { STATE_GROUPS, groupBy } from "./board";
import type { TSave } from "./fields";
import { useBoardNames } from "./use-names";

const CARDS_STEP = 20;

type Props = {
  workspaceSlug: string;
  products: TBoardProduct[];
  states: Record<string, TBoardState[]>;
  save: TSave;
  onOpen: (product: TBoardProduct) => void;
};

/** The first cards of a column; hundreds at once take seconds to draw. */
function CardList({
  products,
  render,
}: {
  products: TBoardProduct[];
  render: (product: TBoardProduct) => React.ReactNode;
}) {
  const [limit, setLimit] = useState(CARDS_STEP);
  const { t } = useTranslation();
  return (
    <>
      {products.slice(0, limit).map(render)}
      {products.length > limit && (
        <Button
          variant="ghost"
          size="sm"
          stretch="full"
          label={`${t("common.load_more")} (${products.length - limit})`}
          onClick={() => setLimit((current) => current + CARDS_STEP)}
        />
      )}
    </>
  );
}

type TChoice = { product: TBoardProduct; options: TBoardState[] };

function Card(props: { product: TBoardProduct; path: string; onOpen: () => void }) {
  const { product, path, onOpen } = props;
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { id, team_id, can_edit } = product;

  useEffect(() => {
    if (!ref.current || !can_edit) return;
    return draggable({
      element: ref.current,
      getInitialData: () => ({ productId: id, teamId: team_id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [id, team_id, can_edit]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={cn("w-full space-y-1 rounded-md border border-subtle bg-layer-2 p-2 text-left", {
        "cursor-grab": can_edit,
        "opacity-40": isDragging,
      })}
    >
      <span className="block text-body-xs-medium text-primary">{product.name}</span>
      <span className="block truncate text-caption-sm-regular text-tertiary">{path}</span>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-caption-sm-regular text-secondary">{product.state_name}</span>
        <ProductIndicatorBadge indicator={product.indicator} />
      </span>
    </button>
  );
}

type CellProps = {
  teamId: string;
  group: TStateGroups;
  canDrop: (productId: string) => boolean;
  onDrop: (productId: string) => void;
  children: React.ReactNode;
};

function Cell(props: CellProps) {
  const { teamId, group, canDrop, onDrop, children } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  // the latest handlers without registering the target again
  const handlers = useRef({ canDrop, onDrop });
  useEffect(() => {
    handlers.current = { canDrop, onDrop };
  });

  useEffect(() => {
    if (!ref.current) return;
    return dropTargetForElements({
      element: ref.current,
      canDrop: ({ source }) => source.data.teamId === teamId && handlers.current.canDrop(String(source.data.productId)),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        handlers.current.onDrop(String(source.data.productId));
      },
    });
  }, [teamId, group]);

  return (
    <div
      ref={ref}
      data-group={group}
      className={cn("min-h-20 w-64 shrink-0 space-y-2 rounded-md p-2", isOver ? "bg-accent-subtle" : "bg-layer-1")}
    >
      {children}
    </div>
  );
}

/** Teams in rows, groups of states in columns. Without a mouse the state is changed in the panel. */
export const BoardKanbanView = observer(function BoardKanbanView(props: Props) {
  const { workspaceSlug, products, states, save, onOpen } = props;
  const [choice, setChoice] = useState<TChoice | null>(null);
  const { t } = useTranslation();
  const names = useBoardNames(workspaceSlug);

  const find = (id: string) => products.find((product) => product.id === id);
  const optionsOf = (product: TBoardProduct, group: TStateGroups) =>
    (states[product.project_id ?? ""] ?? []).filter((state) => state.group === group);

  const apply = (product: TBoardProduct, state: TBoardState) =>
    void save(product, { state_id: state.id }, { state_name: state.name, state_group: state.group });

  const handleDrop = (id: string, group: TStateGroups) => {
    const product = find(id);
    if (!product) return;
    const options = optionsOf(product, group);
    if (options.length === 1) apply(product, options[0]);
    else if (options.length > 1) setChoice({ product, options });
  };

  const canDrop = (id: string, group: TStateGroups) => {
    const product = find(id);
    return !!product && product.state_group !== group && optionsOf(product, group).length > 0;
  };

  return (
    <div className="h-full overflow-auto">
      <Dialog open={!!choice} onOpenChange={(open) => !open && setChoice(null)}>
        <DialogContent size="sm">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{t("product_board.choose_state")}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="flex flex-col gap-2">
                {choice?.options.map((state) => (
                  <Button
                    key={state.id}
                    variant="secondary"
                    size="md"
                    stretch="full"
                    label={state.name}
                    onClick={() => {
                      apply(choice.product, state);
                      setChoice(null);
                    }}
                  />
                ))}
              </div>
            </DialogBody>
          </DialogMain>
        </DialogContent>
      </Dialog>
      <div className="sticky top-0 z-10 flex gap-2 bg-surface-1 pb-2">
        {STATE_GROUPS.map((group) => (
          <div key={group} className="w-64 shrink-0 px-2 text-body-xs-semibold text-secondary">
            {t(`workspace_projects.state.${group}`)}
          </div>
        ))}
      </div>
      {[...groupBy(products, (product) => product.team_id)].map(([teamId, items]) => (
        <section key={teamId} aria-label={names.team(items[0])} className="pb-4">
          <h4 className="sticky left-0 w-fit px-2 py-1 text-body-sm-semibold text-primary">{names.team(items[0])}</h4>
          <div className="flex gap-2">
            {STATE_GROUPS.map((group) => (
              <Cell
                key={group}
                teamId={teamId}
                group={group}
                canDrop={(id) => canDrop(id, group)}
                onDrop={(id) => handleDrop(id, group)}
              >
                <CardList
                  products={items.filter((product) => product.state_group === group)}
                  render={(product) => (
                    <Card
                      key={product.id}
                      product={product}
                      path={names.path(product)}
                      onOpen={() => onOpen(product)}
                    />
                  )}
                />
              </Cell>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
