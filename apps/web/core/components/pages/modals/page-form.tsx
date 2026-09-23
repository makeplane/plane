/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// plane imports
import { ETabIndices, EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { EmojiPicker, Logo } from "@plane/blocks/emoji-icon-picker";
import { GlobeOutline, LockOutline, PagesOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/blocks/icons";
import type { TPage } from "@plane/types";

import { getTabIndex } from "@plane/utils";
// components
import { AccessField } from "@/components/common/access-field";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  formData: Partial<TPage>;
  handleFormData: <T extends keyof TPage>(key: T, value: TPage[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

const PAGE_ACCESS_SPECIFIERS: {
  key: EPageAccess;
  i18n_label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
}[] = [
  { key: EPageAccess.PUBLIC, i18n_label: "common.access.public", icon: GlobeOutline },
  { key: EPageAccess.PRIVATE, i18n_label: "common.access.private", icon: LockOutline },
];

export function PageForm(props: Props) {
  const { formData, handleFormData, handleModalClose, handleFormSubmit } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const i18n_access_label = PAGE_ACCESS_SPECIFIERS.find((access) => access.key === formData.access)?.i18n_label;

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_PAGE, isMobile);

  const handlePageFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await handleFormSubmit();
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  const isTitleLengthMoreThan255Character = formData.name ? formData.name.length > 255 : false;

  return (
    <form onSubmit={handlePageFormSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>Create page</DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="flex h-9 w-full items-start gap-2">
            <EmojiPicker
              isOpen={isOpen}
              handleToggle={(val: boolean) => setIsOpen(val)}
              className="flex-shrink0 flex items-center justify-center"
              buttonClassName="flex items-center justify-center bg-layer-2 hover:bg-layer-2-hover rounded-md"
              label={
                <span className="grid h-9 w-9 place-items-center rounded-md">
                  <>
                    {formData?.logo_props?.in_use ? (
                      <Logo logo={formData?.logo_props} size={18} type="lucide" />
                    ) : (
                      <PagesOutline className="h-4 w-4 text-tertiary" />
                    )}
                  </>
                </span>
              }
              onChange={(val: any) => {
                let logoValue = {};

                if (val?.type === "emoji")
                  logoValue = {
                    value: val.value,
                    url: undefined,
                  };
                else if (val?.type === "icon") logoValue = val.value;

                handleFormData("logo_props", {
                  in_use: val?.type,
                  [val?.type]: logoValue,
                });
                setIsOpen(false);
              }}
              defaultIconColor={
                formData?.logo_props?.in_use && formData?.logo_props?.in_use === "icon"
                  ? formData?.logo_props?.icon?.color
                  : undefined
              }
              defaultOpen={formData?.logo_props?.in_use && formData?.logo_props?.in_use === "emoji" ? "emoji" : "icon"}
            />
            <div className="flew-grow w-full space-y-1">
              <InputField
                id="name"
                type="text"
                size="2xl"
                orientation="vertical"
                value={formData.name}
                onChange={(e) => handleFormData("name", e.target.value)}
                placeholder="Title"
                error={
                  isTitleLengthMoreThan255Character
                    ? "Max length of the name should be less than 255 characters"
                    : undefined
                }
                tabIndex={getIndex("name")}
                required
                // the title is the dialog's only field; focus it on open as the legacy form did
                // oxlint-disable-next-line jsx_a11y/no-autofocus
                autoFocus
              />
            </div>
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <DialogInfo>
          <div className="flex items-center gap-2">
            <AccessField
              onChange={(access) => handleFormData("access", access)}
              value={formData?.access ?? EPageAccess.PUBLIC}
              accessSpecifiers={PAGE_ACCESS_SPECIFIERS}
              isMobile={isMobile}
            />
            <h6 className="text-11 font-medium">{t(i18n_access_label || "")}</h6>
          </div>
        </DialogInfo>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          label="Cancel"
          onClick={handleModalClose}
          tabIndex={getIndex("cancel")}
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          type="submit"
          label={isSubmitting ? "Creating" : "Create Page"}
          loading={isSubmitting}
          disabled={isTitleLengthMoreThan255Character}
          tabIndex={getIndex("submit")}
        />
      </DialogActions>
    </form>
  );
}
