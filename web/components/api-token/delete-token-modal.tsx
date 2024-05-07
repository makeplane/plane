import { useState, FC } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
// types
import { IApiToken } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore } from "@/components/core";
// fetch-keys
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// services
import { APITokenService } from "@/services/api_token.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
};

const apiTokenService = new APITokenService();

export const DeleteApiTokenModal: FC<Props> = (props) => {
  const { isOpen, onClose, tokenId } = props;
  // states
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleClose = () => {
    onClose();
    setDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug) return;

    setDeleteLoading(true);

    await apiTokenService
      .deleteApiToken(workspaceSlug.toString(), tokenId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Token deleted successfully.",
        });

        mutate<IApiToken[]>(
          API_TOKENS_LIST(workspaceSlug.toString()),
          (prevData) => (prevData ?? []).filter((token) => token.id !== tokenId),
          false
        );

        handleClose();
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.message ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setDeleteLoading(false));
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isDeleting={deleteLoading}
      isOpen={isOpen}
      title="Delete API token"
      content={
        <>
          Any application using this token will no longer have the access to Plane data. This action cannot be undone.
        </>
      }
    />
  );
};
