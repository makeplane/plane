/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { TQuickAddIssueForm } from "../root";

export const CalendarQuickAddIssueForm = observer(function CalendarQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, isOpen, projectDetail, register, onSubmit, isEpic } = props;

  return (
    <div
      className={`z-20 w-full transition-all ${
        isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-50 flex w-full items-center gap-x-2 rounded-sm border-subtle bg-surface-1 px-2 transition-opacity md:border-[0.5px] md:shadow-raised-100"
      >
        <h4 className="text-13 leading-5 text-placeholder md:text-11">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder={isEpic ? "Epic Title" : "Work item Title"}
          {...register("name", {
            required: `${isEpic ? "Epic" : "Work item"} title is required.`,
          })}
          className="w-full rounded-md bg-transparent py-1.5 pr-2 text-13 leading-5 font-medium text-secondary outline-none md:text-11"
        />
      </form>
    </div>
  );
});
