// react
import React from "react";

// next
import { useRouter } from "next/router";

// swr
import { mutate } from "swr";

// react hooks form
import { useForm } from "react-hook-form";

// services
import issuesService from "services/issues.service";

// fetch keys
import { M_ISSUE_DETAILS } from "constants/fetch-keys";

// hooks
import useToast from "hooks/use-toast";

// ui
import { PrimaryButton, Input } from "components/ui";

// types
import type { linkDetails, IIssueLink } from "types";

type Props = {
  links?: linkDetails[];
  data?: linkDetails;
  onSuccess: () => void;
};

export const CreateUpdateLinkForm: React.FC<Props> = (props) => {
  const { data, links, onSuccess } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      url: "",
    },
  });

  const onSubmit = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const payload = { metadata: {}, ...formData };

    if (!data)
      await issuesService
        .createIssueLink(
          workspaceSlug.toString(),
          projectId.toString(),
          issueId.toString(),
          payload
        )
        .then(() => {
          onSuccess();
          mutate(
            M_ISSUE_DETAILS(workspaceSlug.toString(), projectId.toString(), issueId.toString())
          );
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

      mutate(
        M_ISSUE_DETAILS(workspaceSlug.toString(), projectId.toString(), issueId.toString()),
        (prevData) => ({ ...prevData, issue_link: updatedLinks }),
        false
      );

      await issuesService
        .updateIssueLink(
          workspaceSlug.toString(),
          projectId.toString(),
          issueId.toString(),
          data!.id,
          payload
        )
        .then(() => {
          onSuccess();
          mutate(
            M_ISSUE_DETAILS(workspaceSlug.toString(), projectId.toString(), issueId.toString())
          );
        });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <div className="space-y-5">
          <div className="mt-2 space-y-3">
            <div>
              <Input
                id="url"
                label="URL"
                name="url"
                type="url"
                placeholder="https://..."
                autoComplete="off"
                error={errors.url}
                register={register}
                validations={{
                  required: "URL is required",
                }}
              />
            </div>
            <div>
              <Input
                id="title"
                label="Title (optional)"
                name="title"
                type="text"
                placeholder="Enter title"
                autoComplete="off"
                error={errors.title}
                register={register}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <PrimaryButton
          type="submit"
          loading={isSubmitting}
          className="w-full !py-2 text-custom-text-300 !text-base flex items-center justify-center"
        >
          {data
            ? isSubmitting
              ? "Updating Link..."
              : "Update Link"
            : isSubmitting
            ? "Adding Link..."
            : "Add Link"}
        </PrimaryButton>
      </div>
    </form>
  );
};
