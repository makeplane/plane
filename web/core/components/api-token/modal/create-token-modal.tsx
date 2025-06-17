"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { mutate } from "swr";
// types
import { IApiToken } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
import { renderFormattedDate, csvDownload } from "@plane/utils";
// components
import { CreateApiTokenForm, GeneratedTokenDetails } from "@/components/api-token";
// fetch-keys
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// helpers
// services
import { APITokenService } from "@/services/api_token.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// services
const apiTokenService = new APITokenService();

export const CreateApiTokenModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [neverExpires, setNeverExpires] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null | undefined>(null);
  // router
  const { workspaceSlug } = useParams();

  const handleClose = () => {
    onClose();

    setTimeout(() => {
      setNeverExpires(false);
      setGeneratedToken(null);
    }, 350);
  };

  const downloadSecretKey = (data: IApiToken) => {
    const csvData = {
      Title: data.label,
      Description: data.description,
      Expiry: data.expired_at ? (renderFormattedDate(data.expired_at)?.replace(",", " ") ?? "") : "Never expires",
      "Secret key": data.token ?? "",
    };

    csvDownload(csvData, `secret-key-${Date.now()}`);
  };

  const handleCreateToken = async (data: Partial<IApiToken>) => {
    if (!workspaceSlug) return;

    // make the request to generate the token
    await apiTokenService
      .createApiToken(workspaceSlug.toString(), data)
      .then((res) => {
        setGeneratedToken(res);
        downloadSecretKey(res);

        mutate<IApiToken[]>(
          API_TOKENS_LIST(workspaceSlug.toString()),
          (prevData) => {
            if (!prevData) return;

            return [res, ...prevData];
          },
          false
        );
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err.message || err.detail,
        });

        throw err;
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {generatedToken ? (
        <GeneratedTokenDetails handleClose={handleClose} tokenDetails={generatedToken} />
      ) : (
        <CreateApiTokenForm
          handleClose={handleClose}
          neverExpires={neverExpires}
          toggleNeverExpires={() => setNeverExpires((prevData) => !prevData)}
          onSubmit={handleCreateToken}
        />
      )}
    </ModalCore>
  );
};
