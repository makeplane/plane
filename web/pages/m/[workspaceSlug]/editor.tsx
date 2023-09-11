import { useEffect, useState } from "react";

// next
import type { NextPage } from "next";
import { useRouter } from "next/router";

// cookies
import Cookies from "js-cookie";

// react-hook-form
import { Controller, useForm } from "react-hook-form";

// layouts
import WebViewLayout from "layouts/web-view-layout";

// components
import { TipTapEditor } from "components/tiptap";
import { PrimaryButton, Spinner } from "components/ui";

const Editor: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { workspaceSlug, editable } = router.query;

  const isEditable = editable === "true";

  const { watch, setValue, control } = useForm({
    defaultValues: {
      data: "",
      data_html: "",
    },
  });

  useEffect(() => {
    setIsLoading(true);
    if (!router?.query?.["editable"]) return;
    setIsLoading(false);
    const data_html = Cookies.get("data_html");
    setValue("data_html", data_html ?? "");
  }, [isEditable, setValue, router]);

  return (
    <WebViewLayout fullScreen={isLoading}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <Controller
            name="data_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TipTapEditor
                borderOnFocus={false}
                value={
                  !value ||
                  value === "" ||
                  (typeof value === "object" && Object.keys(value).length === 0)
                    ? watch("data_html")
                    : value
                }
                editable={isEditable}
                noBorder={true}
                workspaceSlug={workspaceSlug?.toString() ?? ""}
                debouncedUpdatesEnabled={true}
                customClassName="min-h-[150px] shadow-sm"
                editorContentCustomClassNames="pb-9"
                onChange={(description: Object, description_html: string) => {
                  onChange(description_html);
                  setValue("data_html", description_html);
                  setValue("data", JSON.stringify(description));
                }}
              />
            )}
          />
          {isEditable && (
            <PrimaryButton
              className="mt-4 w-[calc(100%-30px)] h-[45px] mx-[15px] text-[17px]"
              onClick={() => {
                console.log(
                  "submitted",
                  JSON.stringify({
                    data_html: watch("data_html"),
                  })
                );
              }}
            >
              Submit
            </PrimaryButton>
          )}
        </>
      )}
    </WebViewLayout>
  );
};

export default Editor;
