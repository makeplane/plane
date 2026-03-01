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

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import type { EditorRefApi } from "@plane/editor";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { PagePreviewEditor } from "./editor";

type Props = {
  artifactId: string;
  workspaceSlug: string;
  preloadedData?: Partial<TPage>;
  handleOnChange: (data: Partial<TPage> | null) => void;
  editorRef: React.RefObject<EditorRefApi>;
};

export const PageFormRoot = observer(function PageFormRoot(props: Props) {
  const { artifactId, workspaceSlug, preloadedData, handleOnChange, editorRef } = props;
  // states
  const [isEmojiIconPickerOpen, setIsEmojiIconPickerOpen] = useState(false);
  // form state
  const methods = useForm<Partial<TPage>>({
    defaultValues: { ...preloadedData },
    reValidateMode: "onChange",
  });
  const { control, reset, watch } = methods;

  useEffect(() => {
    if (preloadedData) {
      reset({ ...preloadedData });
    }
  }, [artifactId, preloadedData]);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    const subscription = watch((values) => {
      // clear pending
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        handleOnChange(values as Partial<TPage>);
      }, 500);
    });

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      subscription.unsubscribe?.();
    };
  }, [watch, handleOnChange]);

  return (
    <FormProvider {...methods}>
      <form className="w-full h-full px-page-x py-page-y">
        {/* Page Section */}
        <div className="size-full">
          <div className="w-full max-w-4xl">
            {/* Page Logo */}
            <div className="size-10 -ml-[4px] grid place-items-center rounded-sm hover:bg-layer-1 transition-colors">
              <Controller
                control={control}
                name="logo_props"
                render={({ field: { onChange, value } }) => (
                  <EmojiPicker
                    iconType="lucide"
                    isOpen={isEmojiIconPickerOpen}
                    handleToggle={(val: boolean) => setIsEmojiIconPickerOpen(val)}
                    className="grid place-items-center"
                    buttonClassName="grid place-items-center"
                    label={
                      <span className="size-10 grid place-items-center">
                        {value?.in_use ? (
                          <Logo logo={value} size={36} type="lucide" />
                        ) : (
                          <PageIcon className="size-9 text-tertiary" />
                        )}
                      </span>
                    }
                    onChange={(val) => {
                      let logoValue = {};
                      if (val?.type === "emoji")
                        logoValue = {
                          value: val.value,
                        };
                      else if (val?.type === "icon") logoValue = val.value;
                      onChange({
                        in_use: val?.type,
                        [val?.type]: logoValue,
                      });
                    }}
                    defaultIconColor={value?.in_use && value.in_use === "icon" ? value?.icon?.color : undefined}
                    defaultOpen={
                      value?.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                    }
                  />
                )}
              />
            </div>
            {/* Page Description */}
            <div className="pb-[100px]">
              <Controller
                control={control}
                name="description_html"
                render={({ field: { onChange, value } }) => (
                  <PagePreviewEditor
                    initialValue={value ?? "<p></p>"}
                    onChange={(_json, html) => {
                      onChange(html);
                    }}
                    artifactId={artifactId}
                    workspaceSlug={workspaceSlug}
                    editorRef={editorRef}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
});
