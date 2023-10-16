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
import { Button, Spinner } from "@plane/ui";
import { RichTextEditor } from "@plane/rich-text-editor";
// services
import { FileService } from "services/file.service";
const fileService = new FileService();

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
    <WebViewLayout fullScreen>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-between">
          <Controller
            name="data_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RichTextEditor
                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                deleteFile={fileService.deleteImage}
                borderOnFocus={false}
                value={
                  !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                    ? watch("data_html")
                    : value
                }
                noBorder={true}
                customClassName="h-full shadow-sm overflow-auto"
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
            <Button
              variant="primary"
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
            </Button>
          )}
        </div>
      )}
    </WebViewLayout>
  );
};

export default Editor;
