import { RichTextEditor } from "@plane/rich-text-editor";
import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import issuesService from "services/issues.service";
import { ICurrentUserResponse, IIssue } from "types";
import useReloadConfirmations from "hooks/use-reload-confirmation";
import { Spinner } from "components/ui";
import Image404 from "public/404.svg";
import DefaultLayout from "layouts/default-layout";
import Image from "next/image";
import userService from "services/user.service";
import { useRouter } from "next/router";
import fileService from "services/file.service";

const Editor: NextPage = () => {
  const [user, setUser] = useState<ICurrentUserResponse | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [isLoading, setIsLoading] = useState("false");
  const { setShowAlert } = useReloadConfirmations();
  const [cookies, setCookies] = useState<any>({});
  const [issueDetail, setIssueDetail] = useState<IIssue | null>(null);
  const router = useRouter();
  const { editable } = router.query;
  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      description_html: "",
    },
  });

  const getCookies = () => {
    const cookies = document.cookie.split(";");
    const cookieObj: any = {};
    cookies.forEach((cookie) => {
      const cookieArr = cookie.split("=");
      cookieObj[cookieArr[0].trim()] = cookieArr[1];
    });

    setCookies(cookieObj);
    return cookieObj;
  };

  const getIssueDetail = async (cookiesData: any) => {
    try {
      setIsLoading("true");
      const userData = await userService.currentUser();
      setUser(userData);
      const issueDetail = await issuesService.retrieve(
        cookiesData.MOBILE_slug,
        cookiesData.MOBILE_project_id,
        cookiesData.MOBILE_issue_id
      );
      setIssueDetail(issueDetail);
      setIsLoading("false");
      setValue("description_html", issueDetail.description_html);
      setValue("description", issueDetail.description);
    } catch (e) {
      setIsLoading("error");
      console.log(e);
    }
  };
  useEffect(() => {
    const cookiesData = getCookies();

    getIssueDetail(cookiesData);
  }, []);

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert]);

  const submitChanges = async (
    formData: Partial<IIssue>,
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const payload: Partial<IIssue> = {
      ...formData,
    };

    delete payload.issue_relations;
    delete payload.related_issues;
    await issuesService
      .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload, user)
      .catch((e) => {
        console.log(e);
      });
  };

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!formData) return;

      await submitChanges(
        {
          name: issueDetail?.name ?? "",
          description: formData.description ?? "",
          description_html: formData.description_html ?? "<p></p>",
        },
        cookies.MOBILE_slug,
        cookies.MOBILE_project_id,
        cookies.MOBILE_issue_id
      );
    },
    [submitChanges]
  );

  return isLoading === "error" ? (
    <ErrorEncountered />
  ) : isLoading === "true" ? (
    <div className="grid place-items-center h-screen w-full">
      <Spinner />
    </div>
  ) : (
    <div className="flex blur-none shadow-none backdrop:backdrop-blur-none  justify-center items-center">
      <Controller
        name="description_html"
        control={control}
        render={({ field: { value, onChange } }) => (
          <RichTextEditor
            uploadFile={fileService.getUploadFileFunction(cookies.MOBILE_slug ?? "")}
            deleteFile={fileService.deleteImage}
            borderOnFocus={false}
            value={
              !value ||
              value === "" ||
              (typeof value === "object" && Object.keys(value).length === 0)
                ? watch("description_html")
                : value
            }
            noBorder={true}
            debouncedUpdatesEnabled={true}
            setShouldShowAlert={setShowAlert}
            setIsSubmitting={setIsSubmitting}
            customClassName="min-h-[150px] shadow-sm"
            editorContentCustomClassNames="pb-9"
            onChange={(description: Object, description_html: string) => {
              setShowAlert(true);
              setIsSubmitting("submitting");
              onChange(description_html);
              setValue("description", description);
              handleSubmit(handleDescriptionFormSubmit)().finally(() => {
                setIsSubmitting("submitted");
              });
            }}
          />
        )}
      />
      <div
        className={`absolute right-5 bottom-5 text-xs text-custom-text-200 border border-custom-border-400 rounded-xl w-[6.5rem] py-1 z-10 flex items-center justify-center ${
          isSubmitting === "saved" ? "fadeOut" : "fadeIn"
        }`}
      >
        {isSubmitting === "submitting" ? "Saving..." : "Saved"}
      </div>
    </div>
  );
};

const ErrorEncountered: NextPage = () => (
  <DefaultLayout>
    <div className="grid max-h-fit place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="relative mx-auto h-40 w-40 lg:h-40 lg:w-40">
          <Image src={Image404} layout="fill" alt="404- Page not found" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
        </div>
      </div>
    </div>
  </DefaultLayout>
);

export default Editor;
