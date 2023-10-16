import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
// services
import { IssueService } from "services/issue";
// fetch keys
import { ISSUE_DETAILS } from "constants/fetch-keys";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// types
import type { linkDetails, IIssueLink } from "types";

type Props = {
  isOpen: boolean;
  data?: linkDetails;
  links?: linkDetails[];
  onSuccess: () => void;
};

const issueService = new IssueService();

export const CreateUpdateLinkForm: React.FC<Props> = (props) => {
  const { isOpen, data, links, onSuccess } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      url: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    reset({
      title: data.title,
      url: data.url,
    });
  }, [data, reset]);

  useEffect(() => {
    if (!isOpen)
      reset({
        title: "",
        url: "",
      });
  }, [isOpen, reset]);

  const onSubmit = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const payload = { metadata: {}, ...formData };

    if (!data)
      await issueService
        .createIssueLink(workspaceSlug.toString(), projectId.toString(), issueId.toString(), payload)
        .then(() => {
          onSuccess();
          mutate(ISSUE_DETAILS(issueId.toString()));
        })
        .catch((err) => {
          if (err?.status === 400)
            setToastAlert({
              type: "error",
              title: "Error!",
              message: "This URL already exists for this issue.",
            });
          else
            setToastAlert({
              type: "error",
              title: "Error!",
              message: "Something went wrong. Please try again.",
            });
        });
    else {
      const updatedLinks = links?.map((l) =>
        l.id === data.id
          ? {
              ...l,
              title: formData.title,
              url: formData.url,
            }
          : l
      );

      mutate(ISSUE_DETAILS(issueId.toString()), (prevData: any) => ({ ...prevData, issue_link: updatedLinks }), false);

      await issueService
        .updateIssueLink(workspaceSlug.toString(), projectId.toString(), issueId.toString(), data!.id, payload)
        .then(() => {
          onSuccess();
          mutate(ISSUE_DETAILS(issueId.toString()));
        });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <div className="space-y-5">
          <div className="mt-2 space-y-3">
            <div>
              <Controller
                control={control}
                name="url"
                rules={{
                  required: "URL is required",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <>
                    <label htmlFor="url" className="text-custom-text-200 mb-2">
                      URL
                    </label>
                    <Input
                      id="url"
                      name="url"
                      type="url"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      hasError={Boolean(errors.url)}
                      placeholder="https://..."
                      className="w-full"
                    />
                  </>
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, ref } }) => (
                  <>
                    <label htmlFor="title" className="text-custom-text-200 mb-2">
                      {`Title (optional)`}
                    </label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      hasError={Boolean(errors.title)}
                      placeholder="Enter title"
                      className="w-full"
                    />
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {data ? (isSubmitting ? "Updating Link..." : "Update Link") : isSubmitting ? "Adding Link..." : "Add Link"}
        </Button>
      </div>
    </form>
  );
};
