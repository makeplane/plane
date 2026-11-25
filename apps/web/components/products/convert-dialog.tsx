/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
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
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import type { TIssue, TProductPayload } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// local imports
import { ProductFormFields } from "./form-fields";
import { isProductComplete } from "./helper";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  issue: TIssue;
  onClose: () => void;
  onSubmit: (payload: Partial<TIssue>) => Promise<boolean>;
};

const toPayload = (date: Date | null) => (date ? (renderFormattedPayloadDate(date) ?? null) : null);

/** Asks for what a task lacks to become a product. */
export const ConvertToProductDialog = observer(function ConvertToProductDialog(props: Props) {
  const { isOpen, workspaceSlug, issue, onClose, onSubmit } = props;
  const [product, setProduct] = useState<TProductPayload>({});
  const [startDate, setStartDate] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { start_date, target_date } = issue;

  useEffect(() => {
    if (!isOpen) return;
    setProduct({});
    setStartDate(start_date);
    setTargetDate(target_date);
  }, [isOpen, start_date, target_date]);

  const dates = { start_date: startDate, target_date: targetDate };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isDone = await onSubmit({ kind: "product", product, ...dates });
    setIsSubmitting(false);
    if (isDone) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("product.make_product")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="flex flex-wrap items-center gap-2">
              <ProductFormFields
                workspaceSlug={workspaceSlug}
                projectId={issue.project_id}
                value={product}
                onChange={setProduct}
                variant="pill-md"
              />
              <DateSelect
                value={getDate(startDate) ?? null}
                onChange={(date) => setStartDate(toPayload(date))}
                maxDate={getDate(targetDate) ?? undefined}
                placeholder={t("start_date")}
                variant="pill-md"
              />
              <DateSelect
                value={getDate(targetDate) ?? null}
                onChange={(date) => setTargetDate(toPayload(date))}
                minDate={getDate(startDate) ?? undefined}
                placeholder={t("due_date")}
                variant="pill-md"
              />
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            disabled={!isProductComplete(product, dates)}
            onClick={() => void handleSubmit()}
            label={t("save")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
