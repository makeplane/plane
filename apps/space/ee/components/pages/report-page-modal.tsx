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

import { useState } from "react";
// plane imports
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
// helpers
import { createReportPageEmailLink } from "@/helpers/string.helper";
// plane web imports
import type { ReportPageOptions } from "@/plane-web/constants/report-page";
import { REPORT_PAGE_OPTIONS } from "@/plane-web/constants/report-page";

type ReportPageModalProps = { isOpen: boolean; onClose: () => void; anchor: string };

export const ReportPageModal = function ReportPageModal(props: ReportPageModalProps) {
  const { isOpen, onClose, anchor } = props;
  // states
  const [reportReason, setReportReason] = useState<ReportPageOptions>("other");
  const [description, setDescription] = useState("");

  const handleChange = (reason: ReportPageOptions, value: string = "") => {
    setReportReason(reason);
    setDescription(value);
  };

  const handleClose = () => {
    onClose();
    setReportReason("other");
    setDescription("");
  };

  const handleReport = () => {
    try {
      const reason = REPORT_PAGE_OPTIONS.find((option) => option.id === reportReason)?.title || "";
      const mailto = createReportPageEmailLink(anchor, reason, description);
      window.location.href = mailto;
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to report page",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-h5-semibold">Why do you want to report this page?</h3>
          <p className="text-body-sm-regular text-secondary">
            This page is hosted by Plane. Use this form to report content that violates
          </p>
        </div>

        <div className="flex flex-col gap-4" role="radiogroup" aria-label="Report reason">
          {REPORT_PAGE_OPTIONS.map((option) => (
            <label
              key={option.id}
              htmlFor={option.id}
              aria-label={option.title}
              className="flex cursor-pointer items-start gap-2"
            >
              <Input
                id={option.id}
                type="radio"
                name="report-reason"
                checked={reportReason === option.id}
                onChange={() => handleChange(option.id)}
                className="mt-1 cursor-pointer"
              />
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-body-sm-medium">{option.title}</p>
                <p className="text-body-xs-regular text-secondary">{option.description}</p>

                {option.id !== "copyright" && reportReason === option.id && (
                  <TextArea
                    className="border-1 border-subtle rounded-lg text-body-sm-regular resize-none min-h-24 mt-2"
                    placeholder="Tell us how we can improve"
                    value={description}
                    onChange={(e) => handleChange(option.id, e.target.value)}
                  />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          Cancel
        </Button>

        <Button
          variant="error-fill"
          size="lg"
          onClick={handleReport}
          disabled={reportReason === "other" && description.trim().length === 0}
        >
          Report this page
        </Button>
      </div>
    </ModalCore>
  );
};
