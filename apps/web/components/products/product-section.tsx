/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { CubeOutline, UserOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProductPayload } from "@plane/types";
import { calculateTimeAgo } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { ProductIndicatorBadge } from "./indicator-badge";
import { ProductRequirementsLink } from "./requirements-link";
import { ProductTypeSelect } from "./type-select";
import { useProduct, useProductUpdate } from "./use-product";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

const asPercent = (value: number | null | undefined) => (value === null || value === undefined ? "—" : `${value}%`);

/** Product fields, progress and deadline indicator in the sidebar of a product. */
export const ProductSection = observer(function ProductSection(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // states
  const [progress, setProgress] = useState("");
  const [comment, setComment] = useState("");
  // hooks
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const { product, reload } = useProduct(workspaceSlug, projectId, issueId);
  const update = useProductUpdate(workspaceSlug, projectId, issueId);
  // derived values
  const savedProgress = product?.manual_progress?.toString() ?? "";
  const savedComment = product?.status_comment ?? "";

  useEffect(() => setProgress(savedProgress), [savedProgress]);
  useEffect(() => setComment(savedComment), [savedComment]);

  if (!product) return null;

  const save = async (payload: TProductPayload) => {
    const isSaved = await update({ product: payload });
    if (isSaved) await reload();
    return isSaved;
  };

  const saveProgress = async () => {
    if (progress === savedProgress) return;
    const value = progress.trim() === "" ? null : Number(progress);
    const isValid = value === null || (Number.isInteger(value) && value >= 0 && value <= 100);
    if (!isValid || !(await save({ manual_progress: value }))) setProgress(savedProgress);
  };

  const saveComment = async () => {
    if (comment.trim() === savedComment) return;
    if (!(await save({ status_comment: comment.trim() }))) setComment(savedComment);
  };

  const openTasks = (product.total_tasks ?? 0) - (product.completed_tasks ?? 0);
  const commentAuthor = product.status_comment_by ? getUserDetails(product.status_comment_by)?.display_name : undefined;

  return (
    <div className="flex flex-col gap-2">
      <SidebarPropertyListItem icon={CubeOutline} label={t("product.type")}>
        <div className="flex w-full flex-col gap-1">
          <ProductTypeSelect
            workspaceSlug={workspaceSlug}
            value={product.product_type_id}
            onChange={(product_type_id) => void save({ product_type_id })}
            disabled={disabled}
          />
          <ProductRequirementsLink workspaceSlug={workspaceSlug} productTypeId={product.product_type_id} />
        </div>
      </SidebarPropertyListItem>
      <SidebarPropertyListItem icon={UserOutline} label={t("product.owner")}>
        <MemberSelect
          projectId={projectId}
          value={product.owner_id}
          onChange={(owner_id) => void save({ owner_id })}
          placeholder={t("product.owner")}
          disabled={disabled}
          variant="select-md"
        />
      </SidebarPropertyListItem>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-sm-medium text-primary">
          {t("product.progress")}: {asPercent(product.progress)}
        </span>
        {product.indicator && <ProductIndicatorBadge indicator={product.indicator} />}
      </div>
      <p className="text-caption-md-regular text-tertiary">
        {t("product.calculated", {
          progress: asPercent(product.calculated_progress),
          completed: product.completed_tasks ?? 0,
          total: product.total_tasks ?? 0,
        })}
      </p>
      {product.indicator === "completed" && openTasks > 0 && (
        <p className="text-caption-md-regular text-danger-primary">{t("product.completed_with_open_tasks")}</p>
      )}
      <InputField
        size="lg"
        orientation="vertical"
        label={t("product.manual_progress")}
        hint={t("product.manual_progress_hint")}
        type="number"
        min={0}
        max={100}
        name="manual_progress"
        value={progress}
        disabled={disabled}
        onChange={(event) => setProgress(event.target.value)}
        onBlur={() => void saveProgress()}
      />
      <TextAreaField
        size="lg"
        autoResize
        maxRows={6}
        maxLength={500}
        label={t("product.status_comment")}
        name="status_comment"
        value={comment}
        disabled={disabled}
        onChange={(event) => setComment(event.target.value)}
        onBlur={() => void saveComment()}
      />
      {commentAuthor && product.status_comment_at && (
        <p className="text-caption-md-regular text-tertiary">
          {commentAuthor}, {calculateTimeAgo(product.status_comment_at)}
        </p>
      )}
    </div>
  );
});
