/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
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
import type { TBoardProduct, TBoardState } from "@plane/types";
import { calculateTimeAgo, renderFormattedDate } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
import { formatMeetingTime } from "@/components/meetings/time";
import { useReaderTimezone } from "@/components/meetings/use-reader-timezone";
import { ProductTypeBadge } from "@/components/products/type-badge";
import { ProductIndicatorBadge } from "@/components/products/indicator-badge";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { BoardCommentField, BoardDateField, BoardProgressField, BoardStateField } from "./fields";
import type { TSave } from "./fields";
import { useBoardNames } from "./use-names";
import { useBoardProduct } from "./use-board";

type Props = {
  workspaceSlug: string;
  product: TBoardProduct | undefined;
  states: Record<string, TBoardState[]>;
  save: TSave;
  onClose: () => void;
};

export const BoardPanel = observer(function BoardPanel(props: Props) {
  const { workspaceSlug, product, states, save, onClose } = props;
  const { t, currentLocale } = useTranslation();
  const timeZone = useReaderTimezone();
  const { currentWorkspace } = useWorkspace();
  const { getUserDetails } = useMember();
  const names = useBoardNames(workspaceSlug);
  const { data: detail } = useBoardProduct(workspaceSlug, product);

  if (!product) return null;

  const fieldClassName = "border-subtle";
  const author = product.status_comment_by ? getUserDetails(product.status_comment_by)?.display_name : undefined;
  const rows: [string, React.ReactNode][] = [
    [t("product.type"), <ProductTypeBadge key="type" type={names.typeOf(product)} />],
    ...(product.is_limited ? [] : ([[t("product.owner"), names.owner(product)]] as [string, React.ReactNode][])),
    [
      t("start_date"),
      <BoardDateField key="start" product={product} save={save} field="start_date" className={fieldClassName} />,
    ],
    [
      t("due_date"),
      <BoardDateField key="end" product={product} save={save} field="target_date" className={fieldClassName} />,
    ],
    [
      t("common.state"),
      <BoardStateField
        key="state"
        product={product}
        save={save}
        states={states[product.project_id ?? ""]}
        className={fieldClassName}
      />,
    ],
    [
      t("product.progress"),
      <span key="progress" className="flex items-center gap-2">
        {product.progress === null ? "—" : `${product.progress}%`}
        <ProductIndicatorBadge indicator={product.indicator} />
      </span>,
    ],
    ...(product.is_limited
      ? []
      : ([
          [
            t("product.manual_progress"),
            <BoardProgressField key="manual" product={product} save={save} className={fieldClassName} />,
          ],
          [
            t("product.status_comment"),
            <BoardCommentField key="comment" product={product} save={save} className={fieldClassName} />,
          ],
        ] as [string, React.ReactNode][])),
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{product.name}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="space-y-5">
              <p className="text-body-xs-regular text-tertiary">
                {names.team(product)} / {names.path(product)}
              </p>
              <dl className="grid grid-cols-[10rem_1fr] items-center gap-x-4 gap-y-2 text-body-xs-regular">
                {rows.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-tertiary">{label}</dt>
                    <dd className="min-w-0 text-primary">{value}</dd>
                  </div>
                ))}
              </dl>
              {author && product.status_comment_at && (
                <p className="text-caption-md-regular text-tertiary">
                  {author}, {calculateTimeAgo(product.status_comment_at)}
                </p>
              )}
              {product.is_limited && <p className="text-body-xs-regular text-tertiary">{t("product_board.limited")}</p>}
              {detail?.description_html && currentWorkspace && (
                <RichTextEditor
                  editable={false}
                  id={product.id}
                  initialValue={detail.description_html}
                  workspaceSlug={workspaceSlug}
                  workspaceId={currentWorkspace.id}
                  projectId={product.project_id ?? undefined}
                  containerClassName="border-none p-0!"
                />
              )}
              {!!detail?.tasks?.length && (
                <section aria-label={t("product.items")} className="space-y-1">
                  <h6 className="text-body-sm-semibold text-primary">
                    {t("product.items")} {detail.tasks.length}
                  </h6>
                  <ul className="space-y-1 text-body-xs-regular">
                    {detail.tasks.map((task) => (
                      <li key={task.id} className="flex gap-2">
                        <span className="text-tertiary">
                          {product.project_identifier}-{task.sequence_id}
                        </span>
                        <span className="grow text-primary">{task.name}</span>
                        <span className="text-tertiary">{task.state_name}</span>
                        <span className="text-tertiary">{renderFormattedDate(task.target_date) ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!!detail?.meetings?.length && (
                <section aria-label={t("meeting.meetings")} className="space-y-1">
                  <h6 className="text-body-sm-semibold text-primary">
                    {t("meeting.meetings")} {detail.meetings.length}
                  </h6>
                  <ul className="space-y-1 text-body-xs-regular">
                    {detail.meetings.map((meeting) => (
                      <li key={meeting.id} className="flex gap-2">
                        <span className="text-tertiary">{formatMeetingTime(meeting, timeZone, currentLocale)}</span>
                        <span className="text-primary">{meeting.name}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {product.can_open && (
                <Link
                  href={`/${workspaceSlug}/browse/${product.project_identifier}-${product.sequence_id}/`}
                  className="text-body-xs-medium text-accent-primary hover:underline"
                >
                  {t("product_board.open_in_project")}
                </Link>
              )}
            </div>
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
